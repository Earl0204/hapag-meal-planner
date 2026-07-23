import { useState } from 'react';
import { useGrocery } from '../hooks/useGrocery';
import { ShoppingCart, Loader2, Plus, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Karne', 'Isda', 'Gulay', 'Prutas', 'Mga Kondimento', 'Bigas', 'Gatas/Itlog', 'Meryenda', 'Iba pa'];

export default function GroceryPage() {
  const { lists, activeList, items, toggleItem, addItem, deleteItem, createList } = useGrocery();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', name_local: '', category: '', quantity: '', unit: '', estimated_price: '' });

  const allItems = items.data ?? [];
  const checked = allItems.filter(i => i.is_checked);
  const unchecked = allItems.filter(i => !i.is_checked);

  // Group unchecked by category
  const grouped = CATEGORIES.reduce<Record<string, typeof allItems>>((acc, cat) => {
    const catItems = unchecked.filter(i => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});
  const uncategorized = unchecked.filter(i => !i.category || !CATEGORIES.includes(i.category));
  if (uncategorized.length > 0) grouped['Iba pa'] = [...(grouped['Iba pa'] ?? []), ...uncategorized];

  const totalEst = allItems.reduce((sum, i) => sum + (i.estimated_price ?? 0) * (i.quantity ?? 1), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !activeList) return;
    try {
      await addItem.mutateAsync({
        list_id: activeList.id,
        name: form.name,
        name_local: form.name_local || null,
        category: form.category || null,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        unit: form.unit || null,
        estimated_price: form.estimated_price ? parseFloat(form.estimated_price) : null,
        actual_price: null,
        notes: null,
      } as any);
      toast.success(`"${form.name}" naidagdag!`);
      setForm({ name: '', name_local: '', category: '', quantity: '', unit: '', estimated_price: '' });
      setShowAdd(false);
    } catch {
      toast.error('Hindi na-add. Subukan ulit.');
    }
  }

  async function handleToggle(id: string, is_checked: boolean) {
    await toggleItem.mutateAsync({ id, is_checked });
  }

  async function handleDelete(id: string) {
    await deleteItem.mutateAsync(id);
    toast.success('Naalis!');
  }

  async function handleCreateList() {
    await createList.mutateAsync('Listahan ng Grocery');
    toast.success('Bagong grocery list na gawa!');
  }

  if (lists.isLoading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
        <Loader2 size={24} className="animate-spin" /> Nilo-load...
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={24} /> Grocery List
          </h1>
          {activeList && (
            <p>
              {unchecked.length} na kailangan bilhin · {checked.length} checked
              {totalEst > 0 && <span style={{ color: 'var(--accent)' }}> · Est. ₱{totalEst.toLocaleString()}</span>}
            </p>
          )}
        </div>
        {activeList && (
          <button id="add-grocery-item" className="btn btn-primary btn-sm" onClick={() => setShowAdd(v => !v)}>
            <Plus size={14} /> Magdagdag
          </button>
        )}
      </div>

      {!activeList ? (
        <div className="empty-state">
          <ShoppingCart size={56} />
          <h3>Walang grocery list</h3>
          <p>Gumawa ng bagong listahan para magsimula</p>
          <button className="btn btn-primary" onClick={handleCreateList}>
            <Plus size={14} /> Gumawa ng Listahan
          </button>
        </div>
      ) : (
        <>
          {/* Add form */}
          {showAdd && (
            <div className="card" style={{ marginBottom: 20, border: '1px solid var(--border-accent)', position: 'relative' }}>
              <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
              <h3 style={{ marginBottom: 14 }}>Bagong Item</h3>
              <form onSubmit={handleAdd}>
                <div className="grid-2" style={{ gap: 10, marginBottom: 10 }}>
                  <input className="input" placeholder="Pangalan *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  <input className="input" placeholder="Filipino name" value={form.name_local} onChange={e => setForm(f => ({ ...f, name_local: e.target.value }))} />
                </div>
                <div className="grid-4" style={{ gap: 10, marginBottom: 14 }}>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Kategorya</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className="input" type="number" placeholder="Qty" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                  <input className="input" placeholder="Unit (kg, pcs)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                  <input className="input" type="number" placeholder="₱ Presyo" value={form.estimated_price} onChange={e => setForm(f => ({ ...f, estimated_price: e.target.value }))} />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={addItem.isPending}>
                  {addItem.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Idagdag
                </button>
              </form>
            </div>
          )}

          {/* Unchecked items by category */}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catItems.map(item => (
                  <GroceryItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}

          {unchecked.length === 0 && allItems.length > 0 && (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <Check size={40} color="var(--success)" />
              <h3 style={{ color: 'var(--success)' }}>Natapos na ang grocery!</h3>
              <p>Lahat ng items ay nabili na</p>
            </div>
          )}

          {/* Checked items */}
          {checked.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} color="var(--success)" /> Nabili na ({checked.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {checked.map(item => (
                  <GroceryItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GroceryItemRow({ item, onToggle, onDelete }: {
  item: ReturnType<typeof useGrocery>['items']['data'] extends (infer T)[] | undefined ? T : never;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
      background: item.is_checked ? 'var(--surface)' : 'var(--surface)',
      border: `1px solid ${item.is_checked ? 'transparent' : 'var(--border)'}`,
      borderRadius: 8,
      opacity: item.is_checked ? 0.5 : 1,
      transition: 'all var(--transition)',
    }}>
      <button
        onClick={() => onToggle(item.id, item.is_checked)}
        style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: item.is_checked ? 'var(--success)' : 'transparent',
          border: `2px solid ${item.is_checked ? 'var(--success)' : 'var(--border)'}`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--transition)',
        }}
      >
        {item.is_checked && <Check size={12} color="#0e0c08" strokeWidth={3} />}
      </button>

      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: 14, fontWeight: 500, color: 'var(--text)',
          textDecoration: item.is_checked ? 'line-through' : 'none',
        }}>
          {item.name}
        </span>
        {item.name_local && <span style={{ fontSize: 12, color: 'var(--accent)', marginLeft: 6 }}>{item.name_local}</span>}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          {item.quantity && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.quantity} {item.unit}</span>}
          {item.estimated_price && <span style={{ fontSize: 12, color: 'var(--accent)' }}>₱{item.estimated_price}</span>}
        </div>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color var(--transition)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
