import { useMealPlan } from '../hooks/useMealPlan';
import { CalendarDays, Loader2, CheckCircle, Circle, Zap, Plus, Coffee, Sun, Cookie, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays, startOfWeek } from 'date-fns';

const DAYS_PH = ['Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado', 'Linggo'];
const MEAL_TYPES = [
  { key: 'almusal',    label: 'Almusal',    Icon: Coffee,  color: 'rgba(245,166,35,0.12)' },
  { key: 'tanghalian', label: 'Tanghalian', Icon: Sun,     color: 'rgba(74,222,128,0.08)' },
  { key: 'merienda',   label: 'Merienda',   Icon: Cookie,  color: 'rgba(251,191,36,0.08)' },
  { key: 'hapunan',    label: 'Hapunan',    Icon: Moon,    color: 'rgba(168,85,247,0.08)' },
] as const;

export default function MealPlanPage() {
  const { currentPlan, planDays, toggleCooked } = useMealPlan();

  const weekStart = currentPlan.data?.week_start_date
    ? new Date(currentPlan.data.week_start_date)
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const days = DAYS_PH.map((dayName, i) => ({
    dayName,
    date: addDays(weekStart, i),
    dateStr: format(addDays(weekStart, i), 'yyyy-MM-dd'),
  }));

  const isLoading = currentPlan.isLoading || planDays.isLoading;

  async function handleToggle(id: string, is_cooked: boolean) {
    try {
      await toggleCooked.mutateAsync({ id, is_cooked: !is_cooked });
      toast.success(is_cooked ? 'Inalis sa luto' : '✅ Nailuto na!');
    } catch {
      toast.error('Hindi na-update. Subukan ulit.');
    }
  }

  if (isLoading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
        <Loader2 size={24} className="animate-spin" /> Nilo-load ang meal plan...
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1>Lingguhang Meal Plan 📅</h1>
          {currentPlan.data && (
            <p>
              {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              {currentPlan.data.weekly_budget && (
                <span style={{ marginLeft: 8, color: 'var(--accent)' }}>
                  · Budget: ₱{currentPlan.data.weekly_budget.toLocaleString()}
                </span>
              )}
            </p>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => alert('AI meal plan generation — Pro/Ultra feature')}>
          <Zap size={14} /> AI Generate Plan
        </button>
      </div>

      {!currentPlan.data ? (
        /* No plan yet */
        <div className="empty-state">
          <CalendarDays size={56} />
          <h3>Wala pang meal plan</h3>
          <p>Gumawa ng lingguhang plano para sa inyong pamilya</p>
          <button className="btn btn-primary" onClick={() => alert('Create meal plan — coming soon')}>
            <Plus size={14} /> Gumawa ng Meal Plan
          </button>
        </div>
      ) : (
        /* 7-day grid */
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${DAYS_PH.length}, minmax(180px, 1fr))`,
            gap: 12,
            minWidth: 900,
          }}>
            {days.map(({ dayName, date, dateStr }) => {
              const dayMeals = planDays.data?.filter(d => d.day_date === dateStr) ?? [];
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
              return (
                <div
                  key={dateStr}
                  style={{
                    borderRadius: 12,
                    border: isToday ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                    background: isToday ? 'rgba(245,166,35,0.03)' : 'var(--surface)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Day header */}
                  <div style={{
                    padding: '10px 14px',
                    background: isToday ? 'var(--accent-muted)' : 'var(--surface-hover)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: isToday ? 'var(--accent)' : 'var(--text)' }}>
                      {dayName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {format(date, 'MMM d')}
                    </div>
                  </div>

                  {/* Meal slots */}
                  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {MEAL_TYPES.map(({ key, label, Icon, color }) => {
                      const meal = dayMeals.find(m => m.meal_type === key);
                      return (
                        <div
                          key={key}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: meal?.is_cooked ? 'var(--success-muted)' : color,
                            border: `1px solid ${meal?.is_cooked ? 'rgba(74,222,128,0.15)' : 'transparent'}`,
                            minHeight: 60,
                          }}
                        >
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon size={11} />{label}
                          </div>
                          {meal ? (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <button
                                onClick={() => handleToggle(meal.id, meal.is_cooked)}
                                style={{ background: 'none', color: meal.is_cooked ? 'var(--success)' : 'var(--text-disabled)', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}
                              >
                                {meal.is_cooked ? <CheckCircle size={14} /> : <Circle size={14} />}
                              </button>
                              <div style={{
                                fontSize: 12, fontWeight: 600,
                                color: meal.is_cooked ? 'var(--success)' : 'var(--text)',
                                lineHeight: 1.3,
                              }}>
                                {meal.recipes?.title ?? meal.custom_meal ?? 'Custom'}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: 'var(--text-disabled)' }}>Walang nakatakda</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        {MEAL_TYPES.map(({ key, label, Icon }) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <Icon size={13} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}
