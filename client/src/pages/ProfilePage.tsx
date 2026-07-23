import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Zap, Crown, Shield, Save, Loader2, Camera, Check, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Halal', 'Low-Carb', 'Low-Sodium',
  'Diabetic-friendly', 'Gluten-free', 'Dairy-free',
];

const PLAN_INFO = {
  free: {
    label: 'Free Plan',
    Icon: Shield,
    color: 'var(--text-muted)',
    features: ['Search recipes', 'Manual grocery list', 'Save up to 10 recipes'],
    cta: 'Mag-upgrade sa Pro',
  },
  pro: {
    label: 'Pro ₱199/mo',
    Icon: Zap,
    color: 'var(--accent)',
    features: ['AI recipe generation', 'Weekly meal planning', 'Macro tracking', 'Unlimited recipe saves'],
    cta: 'Mag-upgrade sa Ultra',
  },
  ultra: {
    label: 'Ultra ₱499/mo',
    Icon: Crown,
    color: 'var(--warning)',
    features: ['Everything in Pro', 'Household sync', 'TikTok/IG recipe import', 'Delivery export', 'Unlimited AI credits'],
    cta: null,
  },
};

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: profile?.display_name ?? '',
    household_size: profile?.household_size ?? 3,
    dietary_preferences: profile?.dietary_preferences ?? [] as string[],
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: form.display_name,
          household_size: form.household_size,
          dietary_preferences: form.dietary_preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile!.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Na-save ang inyong profile!');
    } catch {
      toast.error('Hindi na-save. Subukan ulit.');
    } finally {
      setSaving(false);
    }
  }

  function toggleDiet(pref: string) {
    setForm(f => ({
      ...f,
      dietary_preferences: f.dietary_preferences.includes(pref)
        ? f.dietary_preferences.filter(p => p !== pref)
        : [...f.dietary_preferences, pref],
    }));
  }

  const planInfo = PLAN_INFO[profile?.plan ?? 'free'];
  const PlanIcon = planInfo.Icon;
  const aiRemaining = profile
    ? (profile.ai_credits_limit === -1 ? '∞' : Math.max(0, profile.ai_credits_limit - profile.ai_credits_used))
    : 0;

  return (
    <div className="page-content" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={24} /> Profile & Settings
          </h1>
          <p>I-manage ang inyong account at preferences</p>
        </div>
      </div>

      {/* Avatar + Plan */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #e07a1f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 800, color: '#0e0c08',
            border: '3px solid var(--border-accent)',
          }}>
            {profile?.display_name?.[0]?.toUpperCase() ?? <User size={28} />}
          </div>
          <button style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--surface-active)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>
            <Camera size={12} />
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{profile?.display_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <PlanIcon size={16} color={planInfo.color} />
            <span style={{ fontSize: 14, fontWeight: 600, color: planInfo.color }}>{planInfo.label}</span>
          </div>
        </div>
        {/* AI Credits */}
        <div style={{
          padding: '12px 20px',
          background: 'var(--accent-muted)',
          borderRadius: 10,
          border: '1px solid var(--border-accent)',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Zap size={14} color="var(--accent)" fill="var(--accent)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>AI Credits</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{aiRemaining}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>remaining</div>
        </div>
      </div>

      {/* Subscription */}
      <div className="card" style={{
        marginBottom: 20,
        border: `1px solid ${planInfo.color === 'var(--warning)' ? 'rgba(251,191,36,0.2)' : planInfo.color === 'var(--accent)' ? 'var(--border-accent)' : 'var(--border)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {profile?.plan === 'ultra' ? <Crown size={18} color="var(--warning)" /> : <Shield size={18} color={planInfo.color} />}
              <h3>{planInfo.label}</h3>
            </div>
            <p style={{ fontSize: 12 }}>Kasalukuyang subscription</p>
          </div>
          {planInfo.cta && (
            <button className="btn btn-primary btn-sm" onClick={() => alert('Redirecting to Stripe checkout...')}>
              <Zap size={12} /> {planInfo.cta}
            </button>
          )}
        </div>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {planInfo.features.map(feat => (
            <li key={feat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              <Check size={14} color="var(--success)" />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      {/* Edit Profile */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>I-edit ang Profile</h3>
        <form onSubmit={handleSave}>
          {/* Display name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Pangalan</label>
            <input
              id="profile-display-name"
              className="input"
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="Ilagay ang inyong pangalan"
            />
          </div>

          {/* Household size */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Laki ng Pamilya
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, household_size: n }))}
                  style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: form.household_size === n ? 'var(--accent)' : 'var(--surface-hover)',
                    color: form.household_size === n ? '#0e0c08' : 'var(--text)',
                    border: `1px solid ${form.household_size === n ? 'var(--accent)' : 'var(--border)'}`,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    transition: 'all var(--transition)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
              {form.household_size} miyembro ng pamilya
            </div>
          </div>

          {/* Dietary preferences */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              Dietary Preferences
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DIETARY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleDiet(opt)}
                  className={`btn btn-sm ${form.dietary_preferences.includes(opt) ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button id="save-profile" type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            I-save ang Profile
          </button>
        </form>
      </div>
    </div>
  );
}
