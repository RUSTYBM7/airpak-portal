import { supabase } from '../lib/supabase';

export interface AdminOverride {
  id: string;
  target_type: 'shipment' | 'user' | 'pricing';
  target_id: string;
  action_type: 'hold' | 'block' | 'price_adjust';
  params: Record<string, any>;
  reason: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateOverrideInput {
  target_type: 'shipment' | 'user' | 'pricing';
  target_id: string;
  action_type: 'hold' | 'block' | 'price_adjust';
  params?: Record<string, any>;
  reason: string;
  expires_at?: string | null;
}

export const getOverrides = async (): Promise<AdminOverride[]> => {
  const { data, error } = await supabase
    .from('admin_overrides')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as AdminOverride[];
};

export const createOverride = async (input: CreateOverrideInput, createdBy: string): Promise<AdminOverride> => {
  const { data, error } = await supabase
    .from('admin_overrides')
    .insert({
      ...input,
      params: input.params || {},
      is_active: true,
      created_by: createdBy
    })
    .select()
    .single();

  if (error) throw error;
  return data as AdminOverride;
};

export const updateOverride = async (id: string, updates: Partial<CreateOverrideInput> & { is_active?: boolean }): Promise<AdminOverride> => {
  const { data, error } = await supabase
    .from('admin_overrides')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as AdminOverride;
};

export const deactivateOverride = async (id: string): Promise<AdminOverride> => {
  return updateOverride(id, { is_active: false });
};

export const subscribeToOverrides = (callback: (payload: any) => void) => {
  return supabase
    .channel('admin_overrides_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_overrides' }, callback)
    .subscribe();
};

export const unsubscribeFromOverrides = (channel: any) => {
  supabase.removeChannel(channel);
};
