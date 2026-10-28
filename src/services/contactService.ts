import { supabase } from './supabaseClient';
import { friendlyError } from './errors';
import type { ContactMessage, ContactSubject } from '../types/content';

export interface ContactPayload {
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
}

/** Envio público: só INSERT é permitido pelo banco; nunca é possível ler as mensagens daqui. */
export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert({
    name: payload.name.trim(),
    email: payload.email.trim(),
    subject: payload.subject,
    message: payload.message.trim(),
  });
  if (error) throw friendlyError(error, 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.');
}

export async function listMessages(): Promise<ContactMessage[]> {
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw friendlyError(error, 'Não foi possível carregar as mensagens.');
  return (data ?? []) as ContactMessage[];
}

export async function markMessageRead(id: string, read: boolean): Promise<void> {
  const { error } = await supabase.from('contact_messages').update({ read }).eq('id', id);
  if (error) throw friendlyError(error, 'Não foi possível atualizar a mensagem.');
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) throw friendlyError(error, 'Não foi possível excluir a mensagem.');
}
