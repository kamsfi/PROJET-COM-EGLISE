import { supabase } from './supabaseClient'

// Bucket public : profils, logos d'organisation, photos de groupe.
// Chemin toujours écrasé (upsert) — une seule image par profil/org/groupe.
export async function uploadAvatarImage(file, folder, id) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${id}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Casse le cache navigateur/CDN après un remplacement d'image au même chemin.
  return `${data.publicUrl}?t=${Date.now()}`
}

// Bucket privé : pièces jointes de message (conversation ou groupe).
export async function uploadAttachment(file, folder, id) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${folder}/${id}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from('attachments').upload(path, file)
  if (error) throw error
  return { attachment_path: path, attachment_name: file.name, attachment_type: file.type || 'application/octet-stream' }
}

export async function getAttachmentSignedUrl(path) {
  const { data, error } = await supabase.storage.from('attachments').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
