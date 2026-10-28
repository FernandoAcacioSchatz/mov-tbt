import { createClient } from '@supabase/supabase-js';
import { env } from '../utils/env';

/**
 * Cliente único do Supabase. Usa apenas a chave pública (publishable/anon).
 * Quem pode ler ou escrever o quê é decidido pelas regras (RLS) do banco, não por este código.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
