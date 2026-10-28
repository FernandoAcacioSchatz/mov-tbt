import { supabase } from './supabaseClient';
import { ServiceError } from './errors';
import type { AdminUser } from '../types/content';

interface FunctionResponse { error?: string; admins?: AdminUser[]; ok?: boolean }

async function call(body: Record<string, unknown>): Promise<FunctionResponse> {
  const { data, error, response } = await supabase.functions.invoke<FunctionResponse>('admin-users', { body });
  if (error) {
    // A função devolve { error: "mensagem" } com status 4xx/5xx
    try {
      const parsed = (await response?.json()) as FunctionResponse | undefined;
      if (parsed?.error) throw new ServiceError(parsed.error);
    } catch (inner) {
      if (inner instanceof ServiceError) throw inner;
    }
    throw new ServiceError('Não foi possível concluir a ação.');
  }
  return data ?? {};
}

export async function listAdmins(): Promise<AdminUser[]> {
  return (await call({ action: 'list' })).admins ?? [];
}

export async function createAdmin(email: string, password: string): Promise<void> {
  await call({ action: 'create', email, password });
}

export async function removeAdmin(userId: string): Promise<void> {
  await call({ action: 'remove', user_id: userId });
}
