import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface PantryItem {
  id: string;
  name: string;
  name_local: string | null;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  purchase_price: number | null;
  expiry_date: string | null;
  is_expired: boolean;
  location: 'ref' | 'freezer' | 'pantry' | 'counter';
  notes: string | null;
  added_at: string;
}

export function usePantry() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['pantry', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user!.id)
        .order('added_at', { ascending: false });
      if (error) throw error;
      return data as PantryItem[];
    },
    enabled: !!user?.id,
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<PantryItem, 'id' | 'is_expired' | 'added_at'>) => {
      const { data, error } = await supabase
        .from('pantry_items')
        .insert({ ...item, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pantry'] }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<PantryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('pantry_items')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pantry'] }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pantry_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pantry'] }),
  });

  return { ...query, addItem, updateItem, deleteItem };
}
