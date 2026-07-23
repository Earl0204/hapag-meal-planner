import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Recipe {
  id: string;
  title: string;
  title_local: string | null;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  difficulty_local: string | null;
  prep_time: number | null;
  cook_time: number | null;
  total_time: number | null;
  servings: number;
  cost_estimate_min: number | null;
  cost_estimate_max: number | null;
  calories_per_serving: number | null;
  meal_type: string[];
  dietary_tags: string[];
  is_ai_generated: boolean;
  is_featured: boolean;
  rating_avg: number;
  rating_count: number;
  save_count: number;
  mama_sita_products: string[] | null;
}

export function useRecipes(filters?: { cuisine_type?: string; meal_type?: string; search?: string }) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      let q = supabase
        .from('recipes')
        .select('id,title,title_local,description,image_url,cuisine_type,difficulty,difficulty_local,prep_time,cook_time,total_time,servings,cost_estimate_min,cost_estimate_max,calories_per_serving,meal_type,dietary_tags,is_ai_generated,is_featured,rating_avg,rating_count,save_count,mama_sita_products')
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('rating_avg', { ascending: false })
        .limit(60);

      if (filters?.cuisine_type) q = q.eq('cuisine_type', filters.cuisine_type);
      if (filters?.search) q = q.ilike('title', `%${filters.search}%`);

      const { data, error } = await q;
      if (error) throw error;
      return data as Recipe[];
    },
  });
}

export function useSavedRecipes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved-recipes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('recipe_id, recipes(id,title,title_local,image_url,difficulty,total_time,cost_estimate_min,cost_estimate_max,rating_avg)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
