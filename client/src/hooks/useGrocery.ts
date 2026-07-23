import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface GroceryList {
  id: string;
  title: string;
  status: 'active' | 'shopping' | 'completed' | 'archived';
  shop_date: string | null;
  total_estimated_cost: number | null;
  total_actual_cost: number | null;
  preferred_store: string | null;
  notes: string | null;
  created_at: string;
}

export interface GroceryItem {
  id: string;
  list_id: string;
  name: string;
  name_local: string | null;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  estimated_price: number | null;
  actual_price: number | null;
  is_checked: boolean;
  notes: string | null;
  sort_order: number;
}

export function useGrocery() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const lists = useQuery({
    queryKey: ['grocery-lists', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['active', 'shopping'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GroceryList[];
    },
    enabled: !!user?.id,
  });

  const activeList = lists.data?.[0] ?? null;

  const items = useQuery({
    queryKey: ['grocery-items', activeList?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .select('*')
        .eq('list_id', activeList!.id)
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data as GroceryItem[];
    },
    enabled: !!activeList?.id,
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, is_checked }: { id: string; is_checked: boolean }) => {
      const { error } = await supabase
        .from('grocery_list_items')
        .update({ is_checked, checked_at: is_checked ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grocery-items'] }),
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<GroceryItem, 'id' | 'is_checked' | 'sort_order'>) => {
      const { data, error } = await supabase
        .from('grocery_list_items')
        .insert({ ...item, is_checked: false })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grocery-items'] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grocery_list_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grocery-items'] }),
  });

  const createList = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({ user_id: user!.id, title })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grocery-lists'] }),
  });

  return { lists, activeList, items, toggleItem, addItem, deleteItem, createList };
}
