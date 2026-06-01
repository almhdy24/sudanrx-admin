import { supabase } from '../supabaseClient';

export async function fetchGuidelines({ search, categoryId } = {}) {
  let query = supabase
    .from('guidelines')
    .select(`
      *,
      category:categories(name),
      sections:guideline_sections(*)
    `);

  if (search) query = query.ilike('title', `%${search}%`);
  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) throw error;
  data.forEach(g => g.sections?.sort((a,b) => a.sort_order - b.sort_order));
  return data;
}

export async function createGuideline({ title, category_id, status, sections }, userId) {
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const { data: guideline, error: gErr } = await supabase
    .from('guidelines')
    .insert([{ title, slug, category_id, status }])
    .select()
    .single();
  if (gErr) throw gErr;

  if (sections && sections.length > 0) {
    const sectionsData = sections.map((sec, i) => ({
      guideline_id: guideline.id,
      section_type: sec.section_type,
      title: sec.title || '',
      content: sec.content || '',
      sort_order: i,
    }));
    const { error: sErr } = await supabase.from('guideline_sections').insert(sectionsData);
    if (sErr) throw sErr;
  }

  await createVersion(guideline.id, 1, title, category_id, status, sections, userId);
  return guideline;
}

export async function updateGuideline(id, { title, category_id, status, sections }, userId) {
  const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const { error: gErr } = await supabase
    .from('guidelines')
    .update({ title, slug, category_id, status })
    .eq('id', id);
  if (gErr) throw gErr;

  await supabase.from('guideline_sections').delete().eq('guideline_id', id);

  if (sections && sections.length > 0) {
    const sectionsData = sections.map((sec, i) => ({
      guideline_id: id,
      section_type: sec.section_type,
      title: sec.title || '',
      content: sec.content || '',
      sort_order: i,
    }));
    const { error: sErr } = await supabase.from('guideline_sections').insert(sectionsData);
    if (sErr) throw sErr;
  }

  const nextVersion = await getNextVersionNumber(id);
  await createVersion(id, nextVersion, title, category_id, status, sections, userId);
}

export async function deleteGuideline(id) {
  const { error } = await supabase.from('guidelines').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Stats helpers ----------
export async function getGuidelineCounts() {
  const { count: total, error } = await supabase
    .from('guidelines')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;

  const { count: published, error: pubErr } = await supabase
    .from('guidelines')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');
  if (pubErr) throw pubErr;

  return { total: total || 0, published: published || 0, draft: (total || 0) - (published || 0) };
}

export async function getSectionsCount() {
  const { count, error } = await supabase
    .from('guideline_sections')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

export async function getVersionsCount() {
  const { count, error } = await supabase
    .from('guideline_versions')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}

export async function getRecentGuidelines(limit = 5) {
  const { data, error } = await supabase
    .from('guidelines')
    .select('title, status, updated_at, category:categories(name)')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// --- Internal version helpers (unchanged) ---
async function getNextVersionNumber(guidelineId) {
  const { data, error } = await supabase
    .from('guideline_versions')
    .select('version_number')
    .eq('guideline_id', guidelineId)
    .order('version_number', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data.length > 0 ? data[0].version_number + 1 : 1;
}

async function createVersion(guidelineId, versionNumber, title, categoryId, status, sections, userId) {
  const { error } = await supabase
    .from('guideline_versions')
    .insert([{
      guideline_id: guidelineId,
      version_number: versionNumber,
      title,
      category_id: categoryId,
      status,
      sections: sections || [],
      created_by: userId,
    }]);
  if (error) throw error;
}
