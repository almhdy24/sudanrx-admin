import { supabase } from '../supabaseClient';

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createCategory(name) {
  const { data, error } = await supabase.from('categories').insert([{ name }]).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, name) {
  const { data, error } = await supabase.from('categories').update({ name }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
