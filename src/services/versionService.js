import { supabase } from '../supabaseClient';

/**
 * Fetch all versions for a guideline (ordered by version_number desc)
 */
export async function fetchVersions(guidelineId) {
  const { data, error } = await supabase
    .from('guideline_versions')
    .select('*')
    .eq('guideline_id', guidelineId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Get a single version by id
 */
export async function fetchVersion(versionId) {
  const { data, error } = await supabase
    .from('guideline_versions')
    .select('*')
    .eq('id', versionId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Restore a version → create a new current guideline + new version record.
 * This function is complex, so we handle it in the guideline page.
 */
export async function restoreVersion(versionData, currentGuidelineId) {
  // versionData contains: title, category_id, status, sections
  // We'll create a new version with the same data (as a "restore" action)
  // Actually, we just update the guideline with the old data and then a new version is automatically created by the save logic.
  // So we'll export just the raw data for use in guideline page.
  return versionData;
}
