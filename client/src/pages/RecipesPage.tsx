import { useState } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import RecipeCard from '../components/RecipeCard';
import { Search, Loader2, BookOpen, Utensils, Coffee, Beef, Cookie, Sparkles, Cake, Flag, type LucideIcon } from 'lucide-react';

const CUISINE_FILTERS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: '',         label: 'Lahat',        Icon: Utensils },
  { value: 'Filipino', label: 'Filipino',     Icon: Flag },
  { value: 'Almusal',  label: 'Almusal',      Icon: Coffee },
  { value: 'Ulam',     label: 'Ulam',         Icon: Beef },
  { value: 'Merienda', label: 'Merienda',     Icon: Cookie },
  { value: 'Fiesta',   label: 'Fiesta',       Icon: Sparkles },
  { value: 'Dessert',  label: 'Panghimagas',  Icon: Cake },
];

export default function RecipesPage() {
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => setDebouncedSearch(value), 400);
    setSearchTimer(t);
  }

  const { data: recipes, isLoading } = useRecipes({
    cuisine_type: cuisine || undefined,
    search: debouncedSearch || undefined,
  });

  return (
    <div className="page-content">
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={24} /> Mga Recipe
          </h1>
          <p>Authentic Filipino dishes para sa pamilya</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: 480 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            id="recipe-search"
            type="text"
            className="input"
            placeholder="Hanapin ang recipe..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {/* Cuisine filter chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CUISINE_FILTERS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setCuisine(value)}
              className={`btn btn-sm ${cuisine === value ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12, color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="animate-spin" />
          Nilo-load ang mga recipe...
        </div>
      ) : !recipes?.length ? (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>Walang nahanap na recipe</h3>
          <p>Subukan ang ibang keyword o filter</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} ang nahanap
          </div>
          <div className="grid-3">
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
