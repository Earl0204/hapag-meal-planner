import { useState } from 'react';
import { usePantry } from '../hooks/usePantry';
import type { PantryItem } from '../hooks/usePantry';
import { useAuth } from '../context/AuthContext';
import {
  Plus, Package, Loader2, Trash2, AlertTriangle, Zap, X,
  Thermometer, Snowflake, Archive, UtensilsCrossed, type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { differenceInDays } from 'date-fns';

const LOCATIONS: { value: PantryItem['location']; label: string; Icon: LucideIcon }[] = [
  { value: 'ref', label: 'Refrigerator', Icon: Thermometer },
  { value: 'freezer', label: 'Freezer', Icon: Snowflake },
  { value: 'pantry', label: 'Pantry', Icon: Archive },
  { value: 'counter', label: 'Counter', Icon: UtensilsCrossed },
];

const CATEGORIES = ['Karne', 'Isda/Pagkain sa Dagat', 'Gulay', 'Prutas', 'Mga Kondimento', 'Bigas/Butil', 'Gatas/Itlog', 'Meryenda', 'Iba pa'];

function getExpiryStatus(expiry_date: string | null) {
  if (!expiry_date) return null;
  const days = differenceInDays(new Date(expiry_date), new Date());
  if (days < 0) return { label: 'Expired', color: 'var(--error)', bg: 'var(--error-muted)' };
  if (days === 0) return { label: 'Mag-e-expire ngayon!', color: 'var(--error)', bg: 'var(--error-muted)' };
  if (days <= 3) return { label: `${days} araw na lang`, color: 'var(--warning)', bg: 'var(--warning-muted)' };
  return { label: `${days} araw pa`, color: 'var(--success)', bg: 'var(--success-muted)' };
}

interface AddItemForm {
  name: string;
  name_local: string;
  category: string;
  quantity: string;
  unit: string;
  expiry_date: string;
  location: PantryItem['location'];
  purchase_price: string;
}

const EMPTY_FORM: AddItemForm = {
  name: '', name_local: '', category: '', quantity: '',
  unit: '', expiry_date: '', location: 'pantry', purchase_price: '',
};

export default function PantryPage() {
  const { user } = useAuth();
  const { data: items, isLoading, addItem, deleteItem } = usePantry();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddItemForm>(EMPTY_FORM);
  const [activeLocation, setActiveLocation] = useState<string>('all');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Ilagay ang pangalan ng item');
    try {
      await addItem.mutateAsync({
        name: form.name,
        name_local: form.name_local || null,
        category: form.category || null,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        unit: form.unit || null,
        expiry_date: form.expiry_date || null,
        location: form.location,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        notes: null,
        user_id: user!.id,
        household_id: null,
      } as any);
      toast.success(`"${form.name}" naidagdag sa pantry!`);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      toast.error('Hindi na-add ang item. Subukan ulit.');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Alisin ang "${name}" sa pantry?`)) return;
    try {
      await deleteItem.mutateAsync(id);
      toast.success('Naalis na!');
    } catch {
      toast.error('Hindi maalis. Subukan ulit.');
    }
  }

  const filtered = activeLocation === 'all'
    ? (items ?? [])
    : (items ?? []).filter(i => i.location === activeLocation);

  const expiringCount = (items ?? []).filter(i => {
    if (!i.expiry_date) return false;
    const days = differenceInDays(new Date(i.expiry_date), new Date());
    return days >= 0 && days <= 3;
  }).length;

  return (
    <div className="page-content">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={24} /> Aming Pantry
          </h1>
          <p>
            {items?.length ?? 0} items · {expiringCount > 0 && (
              <span style={{ color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={13} color="var(--warning)" /> {expiringCount} malapit mag-expire
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={() => alert('AI recipe generation coming soon!')}>
            <Zap size={14} color="var(--accent)" />
            Gumawa ng Recipe
          </button>
          <button id="add-pantry-item" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Magdagdag
          </button>
        </div>
      </div>

      {/* Location filter */}
      <div className="tab-bar" style={{ marginBottom: 20, maxWidth: 520 }}>
        <button
          className={`tab-item ${activeLocation === 'all' ? 'active' : ''}`}
          onClick={() => setActiveLocation('all')}
        >
          Lahat ({items?.length ?? 0})
        </button>
        {LOCATIONS.map(loc => (
          <button
            key={loc.value}
            className={`tab-item ${activeLocation === loc.value ? 'active' : ''}`}
            onClick={() => setActiveLocation(loc.value)}
          >
            <loc.Icon size={13} style={{ display: 'inline', marginRight: 5 }} /> {loc.label}
          </button>
        ))}
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '1px solid var(--border-accent)', position: 'relative' }}>
          <button
            onClick={() => setShowForm(false)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
          <h3 style={{ marginBottom: 16 }}>Magdagdag ng Item</h3>
          <form onSubmit={handleAdd}>
            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Pangalan *</label>
                <input id="pantry-name" className="input" placeholder="e.g. Chicken, Kamatis" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Filipino Name</label>
                <input className="input" placeholder="e.g. Manok, Kamatis" value={form.name_local} onChange={e => setForm(f => ({ ...f, name_local: e.target.value }))} />
              </div>
            </div>
            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Kategorya</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Pumili ng kategorya</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Lokasyon</label>
                <select className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value as PantryItem['location'] }))}>
                  {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Quantity</label>
                <input className="input" type="number" placeholder="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Unit</label>
                <input className="input" placeholder="kg, pcs, L" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Presyo (₱)</label>
                <input className="input" type="number" placeholder="0" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Expiry Date</label>
                <input className="input" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button id="submit-pantry-item" type="submit" className="btn btn-primary" disabled={addItem.isPending}>
                {addItem.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Idagdag
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Kanselahin</button>
            </div>
          </form>
        </div>
      )}

      {/* Items list */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: '40px 0' }}>
          <Loader2 size={24} className="animate-spin" /> Nilo-load ang pantry...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>Walang laman ang pantry</h3>
          <p>Magdagdag ng mga sangkap para magsimula</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Magdagdag ng Item</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(item => {
            const expiry = getExpiryStatus(item.expiry_date);
            return (
              <div key={item.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'var(--surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(() => { const L = LOCATIONS.find(l => l.value === item.location); return L ? <L.Icon size={18} color="var(--text-muted)" /> : <Package size={18} color="var(--text-muted)" />; })()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{item.name}</span>
                    {item.name_local && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{item.name_local}</span>}
                    {item.category && <span className="badge badge-surface" style={{ fontSize: 10 }}>{item.category}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {item.quantity && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.quantity} {item.unit}</span>}
                    {item.purchase_price && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₱{item.purchase_price}</span>}
                    {expiry && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: expiry.color, background: expiry.bg, padding: '1px 6px', borderRadius: 99 }}>
                        {expiry.color === 'var(--warning)' || expiry.color === 'var(--error)' ? <AlertTriangle size={10} /> : null}
                        {expiry.label}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'all var(--transition)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-muted)'; e.currentTarget.style.color = 'var(--error)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
