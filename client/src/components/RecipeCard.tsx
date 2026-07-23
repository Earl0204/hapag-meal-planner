import { Clock, Users, Star, ChefHat } from 'lucide-react';
import type { Recipe } from '../hooks/useRecipes';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   'badge-success',
  medium: 'badge-warning',
  hard:   'badge-error',
};

const PLACEHOLDER_COLORS = [
  'linear-gradient(135deg,#1a1712,#2a2318)',
  'linear-gradient(135deg,#1a1712,#1e2218)',
  'linear-gradient(135deg,#1a1712,#1a1e22)',
];

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  onClick?: () => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const colorIdx = recipe.title.charCodeAt(0) % PLACEHOLDER_COLORS.length;

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: 0, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 200ms ease',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-accent)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,166,35,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      <div style={{
        height: 160,
        background: recipe.image_url ? undefined : PLACEHOLDER_COLORS[colorIdx],
        overflow: 'hidden',
        position: 'relative',
      }}>
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48, opacity: 0.3,
          }}>
            🍽️
          </div>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6 }}>
          <span className={`badge ${DIFFICULTY_COLORS[recipe.difficulty]}`} style={{ fontSize: 10 }}>
            {recipe.difficulty_local ?? recipe.difficulty}
          </span>
          {recipe.is_ai_generated && (
            <span className="badge badge-accent" style={{ fontSize: 10 }}>✨ AI</span>
          )}
        </div>
        {/* Cost */}
        {(recipe.cost_estimate_min || recipe.cost_estimate_max) && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(14,12,8,0.8)',
            backdropFilter: 'blur(8px)',
            padding: '2px 8px',
            borderRadius: 99,
            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
          }}>
            ₱{recipe.cost_estimate_min ?? 0}–{recipe.cost_estimate_max ?? '?'}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', lineHeight: 1.3, marginBottom: 2 }}>
          {recipe.title}
        </div>
        {recipe.title_local && (
          <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 8 }}>
            {recipe.title_local}
          </div>
        )}
        {recipe.description && (
          <p style={{
            fontSize: 12, color: 'var(--text-muted)', marginBottom: 12,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {recipe.description}
          </p>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {recipe.total_time && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              <Clock size={12} /> {recipe.total_time} min
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
            <Users size={12} /> {recipe.servings} servings
          </span>
          {recipe.rating_count > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--warning)' }}>
              <Star size={11} fill="currentColor" /> {recipe.rating_avg.toFixed(1)}
              <span style={{ color: 'var(--text-muted)' }}>({recipe.rating_count})</span>
            </span>
          )}
          {recipe.calories_per_serving && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
              <ChefHat size={12} /> {recipe.calories_per_serving} kcal
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
