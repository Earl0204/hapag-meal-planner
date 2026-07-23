import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface MealPlan {
  id: string;
  title: string;
  week_start_date: string;
  week_end_date: string;
  calorie_target: number | null;
  weekly_budget: number | null;
  is_ai_generated: boolean;
  estimated_total_cost: number | null;
  status: 'active' | 'archived' | 'template';
}

export interface MealPlanDay {
  id: string;
  plan_id: string;
  day_date: string;
  day_of_week: string;
  meal_type: 'almusal' | 'tanghalian' | 'merienda' | 'hapunan';
  recipe_id: string | null;
  custom_meal: string | null;
  servings: number;
  estimated_cost: number | null;
  is_cooked: boolean;
  recipes?: { title: string; image_url: string | null; total_time: number | null };
}

export function useMealPlan() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const currentPlan = useQuery({
    queryKey: ['meal-plan-current', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as MealPlan | null;
    },
    enabled: !!user?.id,
  });

  const planDays = useQuery({
    queryKey: ['meal-plan-days', currentPlan.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plan_days')
        .select('*, recipes(title, image_url, total_time)')
        .eq('plan_id', currentPlan.data!.id)
        .order('day_date')
        .order('meal_type');
      if (error) throw error;
      return data as MealPlanDay[];
    },
    enabled: !!currentPlan.data?.id,
  });

  const toggleCooked = useMutation({
    mutationFn: async ({ id, is_cooked }: { id: string; is_cooked: boolean }) => {
      const { error } = await supabase
        .from('meal_plan_days')
        .update({ is_cooked, cooked_at: is_cooked ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-plan-days'] }),
  });

  return { currentPlan, planDays, toggleCooked };
}
