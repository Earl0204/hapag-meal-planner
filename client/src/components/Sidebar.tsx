import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Package, CalendarDays,
  ShoppingCart, TrendingUp, User, LogOut, ChevronLeft,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recipes',   icon: BookOpen,        label: 'Mga Recipe' },
  { to: '/pantry',    icon: Package,         label: 'Pantry' },
  { to: '/meal-plan', icon: CalendarDays,    label: 'Meal Plan' },
  { to: '/grocery',   icon: ShoppingCart,    label: 'Grocery' },
  { to: '/prices',    icon: TrendingUp,      label: 'Bantay Presyo' },
];

const PLAN_COLORS: Record<string, string> = {
  free:  'badge-surface',
  pro:   'badge-accent',
  ultra: 'badge-warning',
};

const PLAN_LABELS: Record<string, string> = {
  free:  'Free',
  pro:   'Pro ⚡',
  ultra: 'Ultra 👑',
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success('Paalam! 👋');
    navigate('/login');
  }

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)',
        minWidth: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)',
        background: 'var(--surface)',
        borderRight: 'var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease, min-width 200ms ease',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '20px 14px' : '20px 18px',
        borderBottom: 'var(--glass-border)',
        transition: 'padding 200ms ease',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
          border: '1px solid rgba(245,166,35,0.2)',
          boxShadow: '0 4px 12px rgba(245,166,35,0.15)',
        }}>
          <img src="/icon.png" alt="Hapag" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', lineHeight: 1.1 }}>hapag</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ang Hapag ng Pamilya</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px 13px' : '10px 12px',
              borderRadius: 8,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive ? 'var(--accent-muted)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: 13,
              textDecoration: 'none',
              transition: 'all var(--transition)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {!collapsed && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Profile + Credits */}
      <div style={{ padding: '8px 8px 12px', borderTop: 'var(--glass-border)' }}>
        {/* AI Credits */}
        {!collapsed && profile && (
          <div style={{
            margin: '0 4px 8px',
            padding: '8px 12px',
            background: 'var(--accent-muted)',
            borderRadius: 8,
            border: '1px solid var(--border-accent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Zap size={13} color="var(--accent)" fill="var(--accent)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>AI Credits</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {profile.ai_credits_limit === -1
                ? 'Unlimited'
                : `${Math.max(0, profile.ai_credits_limit - profile.ai_credits_used)} remaining`}
            </div>
          </div>
        )}

        {/* Profile */}
        <NavLink
          to="/profile"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '8px 13px' : '8px 12px',
            borderRadius: 8,
            textDecoration: 'none',
            background: isActive ? 'var(--surface-hover)' : 'transparent',
            transition: 'background var(--transition)',
            overflow: 'hidden',
          })}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #e07a1f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#0e0c08',
          }}>
            {profile?.display_name?.[0]?.toUpperCase() ?? <User size={14} />}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', truncate: 'true', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.display_name ?? 'User'}
              </div>
              <span className={`badge ${PLAN_COLORS[profile?.plan ?? 'free']}`} style={{ fontSize: 10 }}>
                {PLAN_LABELS[profile?.plan ?? 'free']}
              </span>
            </div>
          )}
        </NavLink>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '8px 13px' : '8px 12px',
            width: '100%',
            borderRadius: 8,
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 13,
            marginTop: 2,
            transition: 'all var(--transition)',
            cursor: 'pointer',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--error-muted)'; e.currentTarget.style.color = 'var(--error)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && 'Sign Out'}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: 'absolute',
          top: 22,
          right: -12,
          width: 24, height: 24,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          transition: 'all var(--transition)',
          color: 'var(--text-muted)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeft
          size={13}
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
        />
      </button>
    </aside>
  );
}
