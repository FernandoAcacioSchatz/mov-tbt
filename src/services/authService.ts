import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { ServiceError } from './errors';

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Mensagem genérica de propósito: não revela se o e-mail existe.
  if (error) throw new ServiceError('E-mail ou senha incorretos.');
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

/** Pergunta ao banco se o usuário logado é administrador (a decisão final é sempre do servidor). */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

// ---------- Recuperação de senha ----------

/** Endereço para onde o link do e-mail leva (precisa estar liberado em Supabase → Authentication → URL Configuration). */
export function recoveryRedirectUrl(): string {
  return `${window.location.origin}/redefinir-senha`;
}

/**
 * Pede o e-mail de recuperação. Por segurança a resposta é sempre a mesma:
 * não revela se o e-mail está cadastrado. Só falha em erro de limite de envios.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: recoveryRedirectUrl() });
  if (error && (error.status === 429 || /rate limit|security purposes/i.test(error.message))) {
    // Limite por e-mail: "you can only request this after 37 seconds"
    const secs = error.message.match(/after (\d+) seconds?/i)?.[1];
    if (secs) throw new ServiceError(`Por segurança, aguarde ${secs} segundos para pedir outro link.`);
    // Limite geral de envios do projeto (no e-mail padrão do Supabase: poucos por hora)
    throw new ServiceError('O limite de e-mails por hora foi atingido. Aguarde até 1 hora e tente de novo.');
  }
}

export type RecoveryResult = { ok: true } | { ok: false; reason: 'missing' | 'expired' | 'invalid' };

/**
 * Lê o link de recuperação (no formato do Supabase) e abre a sessão temporária para trocar a senha.
 * Aceita "#access_token=…&type=recovery" (padrão) e "?token_hash=…&type=recovery" (modelo de e-mail personalizado).
 * Apaga os códigos da barra de endereço logo em seguida.
 */
let recoveryOnce: Promise<RecoveryResult> | null = null;

/** Lê o link uma única vez, mesmo que a página execute o código duas vezes (o React faz isso em desenvolvimento). */
export function startRecoveryFromUrl(): Promise<RecoveryResult> {
  recoveryOnce ??= readRecoveryUrl();
  return recoveryOnce;
}

async function readRecoveryUrl(): Promise<RecoveryResult> {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const clean = () => window.history.replaceState(null, '', window.location.pathname);

  const err = hash.get('error_code') || hash.get('error') || query.get('error_code') || query.get('error');
  if (err) { clean(); return { ok: false, reason: /expired/i.test(err + (hash.get('error_description') ?? '')) ? 'expired' : 'invalid' }; }

  const tokenHash = query.get('token_hash');
  if (tokenHash && query.get('type') === 'recovery') {
    clean();
    const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
    return error ? { ok: false, reason: /expired/i.test(error.message) ? 'expired' : 'invalid' } : { ok: true };
  }

  const access = hash.get('access_token'); const refresh = hash.get('refresh_token');
  if (access && refresh && hash.get('type') === 'recovery') {
    clean();
    const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
    return error ? { ok: false, reason: 'invalid' } : { ok: true };
  }
  return { ok: false, reason: 'missing' };
}

/** Grava a nova senha e encerra TODAS as sessões (em qualquer aparelho). */
export async function updatePasswordAndSignOutEverywhere(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (/same|different from the old/i.test(error.message)) throw new ServiceError('A nova senha precisa ser diferente da anterior.');
    if (/weak|pwned|leaked|characters/i.test(error.message)) throw new ServiceError('Essa senha é fraca ou já apareceu em vazamentos. Escolha outra.');
    throw new ServiceError('Não foi possível trocar a senha. Peça um novo link e tente de novo.');
  }
  await supabase.auth.signOut({ scope: 'global' });
}
