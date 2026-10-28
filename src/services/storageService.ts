import { supabase } from './supabaseClient';
import { ServiceError } from './errors';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'Use uma imagem JPG, PNG, WebP ou GIF.';
  if (file.size > MAX_IMAGE_BYTES) return 'A imagem precisa ter no máximo 5 MB.';
  return null;
}

/** Envia a imagem para o bucket e devolve o endereço público. O nome é gerado aqui (nunca o do arquivo). */
export async function uploadImage(file: File): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new ServiceError(problem);
  const path = `${crypto.randomUUID()}.${EXT[file.type]}`;
  const { error } = await supabase.storage.from('site-images').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (error) throw new ServiceError('Não foi possível enviar a imagem.');
  return supabase.storage.from('site-images').getPublicUrl(path).data.publicUrl;
}
