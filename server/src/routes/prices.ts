import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const priceRouter = Router();

// ─── Get Latest Commodity Prices ──────────────────────────────
priceRouter.get('/latest', async (req: Request, res: Response) => {
  const { country = 'PH', region, category } = req.query;

  let query = supabase
    .from('market_prices')
    .select('*')
    .eq('country_code', country)
    .eq('is_latest', true)
    .order('category')
    .order('commodity_name');

  if (region) query = query.eq('region', region);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ prices: data });
});

// ─── Get Price History for a Commodity ────────────────────────
priceRouter.get('/history/:commodityKey', async (req: Request, res: Response) => {
  const { commodityKey } = req.params;
  const { country = 'PH', region, days = '7' } = req.query;

  const since = new Date();
  since.setDate(since.getDate() - parseInt(days as string));

  let query = supabase
    .from('market_prices')
    .select('price_avg, price_min, price_max, price_date, region, source')
    .eq('commodity_key', commodityKey)
    .eq('country_code', country)
    .gte('price_date', since.toISOString().split('T')[0])
    .order('price_date', { ascending: true });

  if (region) query = query.eq('region', region);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({ history: data });
});

// ─── Get Government Announcements ─────────────────────────────
priceRouter.get('/announcements', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('government_announcements')
    .select('*')
    .eq('is_active', true)
    .order('announcement_date', { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ announcements: data });
});

// ─── Submit Community Price Report ────────────────────────────
priceRouter.post('/report', async (req: Request, res: Response) => {
  const { userId, commodityKey, marketName, region, price, unit, photoUrl } = req.body;

  if (!userId || !commodityKey || !price) {
    return res.status(400).json({ error: 'userId, commodityKey, and price are required' });
  }

  const { data, error } = await supabase
    .from('community_price_reports')
    .insert({
      reporter_id: userId,
      commodity_key: commodityKey,
      market_name: marketName,
      region,
      price,
      unit: unit || 'kg',
      photo_url: photoUrl,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ report: data });
});

// ─── Get Trending Price Changes ───────────────────────────────
priceRouter.get('/trending', async (_req: Request, res: Response) => {
  // Get commodities where price changed >5% in last 24 hours
  const { data, error } = await supabase.rpc('get_price_trends');

  if (error) {
    // Fallback: return latest prices sorted by category
    const { data: fallback } = await supabase
      .from('market_prices')
      .select('*')
      .eq('is_latest', true)
      .eq('country_code', 'PH')
      .limit(20);

    return res.json({ trending: fallback || [] });
  }

  return res.json({ trending: data });
});
