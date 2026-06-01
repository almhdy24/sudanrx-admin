import { supabase } from '../supabaseClient';

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateUserRole(userId, newRole) {
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);
  if (error) throw error;
}

export async function deleteUser(userId) {
  // Delete profile (auth user deletion would require service_role)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  if (error) throw error;
  // Note: The actual auth user still exists, but without a profile they lose role-based access.
}
