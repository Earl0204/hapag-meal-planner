import { Router, Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { supabase } from '../lib/supabase';
import Stripe from 'stripe';

export const stripeRouter = Router();

// ─── Create Checkout Session ───────────────────────────────────
stripeRouter.post('/create-checkout', async (req: Request, res: Response) => {
  const { userId, priceId, userEmail } = req.body;

  if (!userId || !priceId) {
    return res.status(400).json({ error: 'userId and priceId are required' });
  }

  try {
    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?checkout=cancelled`,
      metadata: { supabase_user_id: userId },
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('[Stripe] Checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ─── Create Customer Portal Session ───────────────────────────
stripeRouter.post('/portal', async (req: Request, res: Response) => {
  const { userId } = req.body;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(404).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.CLIENT_URL}/dashboard`,
    });

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe] Portal error:', err.message);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// ─── Stripe Webhook Handler ────────────────────────────────────
stripeRouter.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing stripe signature' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature invalid' });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await cancelSubscription(sub);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await recordPayment(invoice, 'succeeded');
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await recordPayment(invoice, 'failed');
        break;
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook] Handler error:', err.message);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ─── Helpers ──────────────────────────────────────────────────
async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.supabase_user_id;
  if (!userId) return;

  const priceId = sub.items.data[0]?.price.id;
  let planName = 'free';

  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
    planName = 'pro';
  } else if (priceId === process.env.STRIPE_ULTRA_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_ULTRA_YEARLY_PRICE_ID) {
    planName = 'ultra';
  }

  const aiCreditsLimit = planName === 'pro' ? 50 : planName === 'ultra' ? -1 : 0;

  // Update profile plan
  await supabase.from('profiles').update({
    plan: planName,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    subscription_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
    ai_credits_limit: aiCreditsLimit,
    ai_credits_used: 0, // reset on renewal
  }).eq('id', userId);

  // Upsert subscription record
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    plan_name: planName,
    status: sub.status,
    billing_currency: 'PHP',
    amount: (sub.items.data[0]?.price.unit_amount ?? 0) / 100,
    billing_interval: sub.items.data[0]?.price.recurring?.interval,
    current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
    current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });
}

async function cancelSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.supabase_user_id;
  if (!userId) return;

  await supabase.from('profiles').update({
    plan: 'free',
    subscription_status: 'canceled',
    ai_credits_limit: 0,
  }).eq('id', userId);

  await supabase.from('subscriptions').update({
    status: 'canceled',
    canceled_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', sub.id);
}

async function recordPayment(invoice: Stripe.Invoice, status: string) {
  const inv = invoice as any;
  const userId = inv.subscription_details?.metadata?.supabase_user_id
    ?? inv.metadata?.supabase_user_id;
  if (!userId) return;

  await supabase.from('payments').insert({
    user_id: userId,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: typeof inv.payment_intent === 'string' ? inv.payment_intent : null,
    amount: (invoice.amount_paid ?? 0) / 100,
    currency: (invoice.currency ?? 'php').toUpperCase(),
    status,
  });
}
