import { supabase } from '../supabaseClient';

const BUCKET = 'guideline-images';

/**
 * Upload an image file to Supabase Storage and record metadata.
 * Returns the public URL.
 */
export async function uploadImage(file, userId, guidelineId = null) {
  // Generate a unique file name
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const filePath = `${userId}/${timestamp}_${safeName}`;

  // Upload to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);
  const publicUrl = publicUrlData.publicUrl;

  // Insert metadata into images table
  const { error: insertError } = await supabase.from('images').insert([
    {
      filename: file.name,
      storage_path: filePath,
      public_url: publicUrl,
      uploaded_by: userId,
      guideline_id: guidelineId,
    },
  ]);
  if (insertError) throw insertError;

  return publicUrl;
}

/**
 * Delete an image (from storage and table)
 */
export async function deleteImage(imageId) {
  // First get the storage path
  const { data: img, error: fetchError } = await supabase
    .from('images')
    .select('storage_path')
    .eq('id', imageId)
    .single();
  if (fetchError) throw fetchError;

  // Delete from storage
  const { error: removeError } = await supabase.storage
    .from(BUCKET)
    .remove([img.storage_path]);
  if (removeError) throw removeError;

  // Delete metadata
  const { error: deleteError } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId);
  if (deleteError) throw deleteError;
}
