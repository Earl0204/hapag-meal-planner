import { useState } from 'react';
import { usePrices } from '../hooks/usePrices';
import {
  TrendingUp, TrendingDown, Minus, Loader2, RefreshCw,
  Drumstick, Fish, Leaf, Apple, Wheat, Egg, ShoppingBasket, Package,
  Store, ShoppingCart, Flag, Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CATEGORIES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: '',      label: 'Lahat',      Icon: ShoppingBasket },
  { value: 'Karne', label: 'Karne',      Icon: Drumstick },
  { value: 'Isda',  label: 'Isda',       Icon: Fish },
  { value: 'Gulay', label: 'Gulay',      Icon: Leaf },
  { value: 'Prutas',label: 'Prutas',     Icon: Apple },
  { value: 'Bigas', label: 'Bigas',      Icon: Wheat },
  { value: 'Itlog', label: 'Itlog',      Icon: Egg },
];

const MARKET_ICONS: Record<string, LucideIcon> = {
  palengke:    Store,
  supermarket: ShoppingCart,
  kadiwa:      Flag,
  online:      Globe,
};

function PriceBar({ min, max, avg }: { min: number; max: number; avg: number }) {
  const range = max - min || 1;
  const pct = ((avg - min) / range) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36, textAlign: 'right' }}>₱{min}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--surface-hover)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: `${pct}%`,
          top: 0, bottom: 0,
          width: 10, height: 10,
          borderRadius: '50%',
          background: 'var(--accent)',
          transform: 'translate(-50%, -2px)',
          boxShadow: '0 0 6px rgba(245,166,35,0.4)',
        }} />
        <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, var(--success-muted), var(--warning-muted), var(--error-muted))' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 36 }}>₱{max}</span>
    </div>
  );
}

export default function PricesPage() {
  const [category, setCategory] = useState('');
  const { data, isLoading, refetch, isFetching } = usePrices(category || undefined);

  const prices = data?.prices ?? [];

  return (
    <div className="page-content">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={24} /> Bantay Presyo
          </h1>
          <p>
            Pinakabagong presyo ng palengke at supermarket
            {data?.updated_at && (
              <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                · I-update: {new Date(data.updated_at).toLocaleDateString('fil-PH')}
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          I-refresh
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            className={`btn btn-sm ${category === c.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCategory(c.value)}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <c.Icon size={13} />{c.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {prices.length > 0 && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Mga Commodity', value: prices.length, sub: 'available' },
            { label: 'Pinakamura', value: `₱${Math.min(...prices.map(p => p.price_min)).toFixed(0)}`, sub: prices.find(p => p.price_min === Math.min(...prices.map(p => p.price_min)))?.commodity_name ?? '' },
            { label: 'Pinakamahal', value: `₱${Math.max(...prices.map(p => p.price_max)).toFixed(0)}`, sub: prices.find(p => p.price_max === Math.max(...prices.map(p => p.price_max)))?.commodity_name ?? '' },
            { label: 'Market Types', value: new Set(prices.map(p => p.market_type)).size, sub: 'sources' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: '40px 0' }}>
          <Loader2 size={24} className="animate-spin" /> Kinukuha ang presyo...
        </div>
      ) : prices.length === 0 ? (
        <div className="empty-state">
          <TrendingUp size={56} />
          <h3>Walang presyo na available</h3>
          <p>Hindi pa nakukuha ang data mula sa DA/DTI. Subukan mamaya.</p>
          <button className="btn btn-primary" onClick={() => refetch()}>I-refresh</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)' }}>
                {['Commodity', 'Kategorya', 'Pinaka-Mura', 'Avg', 'Pinaka-Mahal', 'Range', 'Market', 'Petsa'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prices.map((price, i) => (
                <tr
                  key={price.id}
                  style={{
                    borderBottom: i < prices.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{price.commodity_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>per {price.unit}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-surface" style={{ fontSize: 11 }}>{price.category}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>
                    ₱{price.price_min.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 15, color: 'var(--accent)', fontWeight: 700 }}>
                    ₱{price.price_avg.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--error)', fontWeight: 600 }}>
                    ₱{price.price_max.toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: 160 }}>
                    <PriceBar min={price.price_min} max={price.price_max} avg={price.price_avg} />
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                    {(() => { const Icon = MARKET_ICONS[price.market_type] ?? Store; return <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon size={13} />{price.market_type}</span>; })()}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(price.price_date).toLocaleDateString('fil-PH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
