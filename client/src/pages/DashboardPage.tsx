import { useAuth } from '../context/AuthContext';
import { usePantry } from '../hooks/usePantry';
import { useMealPlan } from '../hooks/useMealPlan';
import { useGrocery } from '../hooks/useGrocery';
import {
  Zap, Package, ShoppingCart, CalendarDays, ChefHat,
  ArrowRight, TrendingUp, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { differenceInDays } from 'date-fns';

const MEAL_SLOTS = [
  { key: 'almusal',    label: 'Almusal' },
  { key: 'tanghalian', label: 'Tanghalian' },
  { key: 'merienda',   label: 'Merienda' },
  { key: 'hapunan',    label: 'Hapunan' },
] as const;

const DAYS_PH = ['Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado', 'Linggo'];

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data: pantryItems } = usePantry();
  const { currentPlan, planDays } = useMealPlan();
  const { items: groceryItems } = useGrocery();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi';

  const todayMeals = planDays.data?.filter(d => d.day_date === todayStr) ?? [];
  const expiringItems = pantryItems?.filter(i => {
    if (!i.expiry_date) return false;
    const diff = differenceInDays(new Date(i.expiry_date), new Date());
    return diff >= 0 && diff <= 3;
  }) ?? [];
  const uncheckedGrocery = groceryItems.data?.filter(i => !i.is_checked) ?? [];
  const aiRemaining = profile
    ? (profile.ai_credits_limit === -1 ? '∞' : Math.max(0, profile.ai_credits_limit - profile.ai_credits_used))
    : 0;

  const dayName = DAYS_PH[today.getDay() === 0 ? 6 : today.getDay() - 1];

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          {dayName} · {format(today, 'MMMM d, yyyy')}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
          {greeting},{' '}
          <span className="gradient-text">{profile?.display_name?.split(' ')[0] ?? 'Kababayan'}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Ano ang ulam ngayon? Planuhin natin kasama.</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          {
            icon: Package, label: 'Pantry Items', value: pantryItems?.length ?? 0,
            sub: expiringItems.length > 0 ? `${expiringItems.length} malapit mag-expire` : 'Lahat ay okay',
            subColor: expiringItems.length > 0 ? 'var(--warning)' : 'var(--success)',
            iconBg: 'rgba(251,191,36,0.12)', iconColor: 'var(--warning)',
          },
          {
            icon: ShoppingCart, label: 'Grocery List', value: uncheckedGrocery.length,
            sub: 'items na bilhin pa',
            subColor: 'var(--text-muted)',
            iconBg: 'rgba(74,222,128,0.12)', iconColor: 'var(--success)',
          },
          {
            icon: CalendarDays, label: 'Meals Today', value: todayMeals.length,
            sub: `${todayMeals.filter(m => m.is_cooked).length} niluto na`,
            subColor: 'var(--text-muted)',
            iconBg: 'rgba(245,166,35,0.12)', iconColor: 'var(--accent)',
          },
          {
            icon: Zap, label: 'AI Credits', value: aiRemaining,
            sub: profile?.plan === 'free' ? 'Mag-upgrade para sa more' : `${profile?.plan} plan`,
            subColor: profile?.plan === 'free' ? 'var(--accent)' : 'var(--success)',
            iconBg: 'rgba(245,166,35,0.12)', iconColor: 'var(--accent)',
          },
        ].map(({ icon: Icon, label, value, sub, subColor, iconBg, iconColor }) => (
          <div key={label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={iconColor} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: subColor }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Today's meals */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div>
              <h2 style={{ marginBottom: 2 }}>Mga Pagkain Ngayon</h2>
              <p style={{ fontSize: 12 }}>{dayName}</p>
            </div>
            <a href="/meal-plan" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              Tingnan lahat <ArrowRight size={12} />
            </a>
          </div>

          {todayMeals.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <CalendarDays size={32} />
              <p style={{ fontSize: 13 }}>Walang meal plan ngayon</p>
              <a href="/meal-plan" className="btn btn-primary btn-sm">Mag-plan</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MEAL_SLOTS.map(({ key, label }) => {
                const meal = todayMeals.find(m => m.meal_type === key);
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px',
                    background: meal?.is_cooked ? 'var(--success-muted)' : 'var(--surface-hover)',
                    borderRadius: 8,
                    opacity: meal ? 1 : 0.45,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {meal?.recipes?.title ?? meal?.custom_meal ?? 'Walang nakatakda'}
                      </div>
                    </div>
                    {meal?.is_cooked && (
                      <CheckCircle size={16} color="var(--success)" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Expiry warning */}
          {expiringItems.length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(251,191,36,0.2)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--warning-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={18} color="var(--warning)" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Malapit nang mag-expire</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {expiringItems.slice(0, 3).map(i => i.name).join(', ')}
                    {expiringItems.length > 3 && ` +${expiringItems.length - 3} pa`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI CTA */}
          <div className="card" style={{ background: 'var(--accent-muted)', border: '1px solid var(--border-accent)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
              <ChefHat size={20} color="var(--accent)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>AI Meal Assistant</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Gamitin ang inyong pantry para sa recipe</div>
              </div>
            </div>
            <a href="/pantry" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <Zap size={14} /> Gumawa ng Recipe mula sa Pantry
            </a>
          </div>

          {/* Prices teaser */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <TrendingUp size={18} color="var(--accent)" />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Bantay Presyo</div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              Alamin ang pinakabagong presyo ng palengke at supermarket.
            </p>
            <a href="/prices" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
              Tingnan ang presyo <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
