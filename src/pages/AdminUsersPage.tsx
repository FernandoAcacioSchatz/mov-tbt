import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminBar } from '../admin/AdminBar';
import { adminUserSchema, type AdminUserValues } from '../schemas/authSchemas';
import { createAdmin, listAdmins, removeAdmin } from '../services/adminUsersService';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PasswordInput } from '../components/ui/PasswordInput';
import type { AdminUser } from '../types/content';

export function AdminUsersPage() {
  useDocumentTitle('Administradores — Movimento TBT');
  const { session } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[] | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AdminUserValues>({ resolver: zodResolver(adminUserSchema), defaultValues: { email: '', password: '' } });

  const load = useCallback(async () => {
    try { setAdmins(await listAdmins()); } catch (e) { setMsg({ text: e instanceof Error ? e.message : 'Erro ao carregar.', ok: false }); }
  }, []);
  useEffect(() => {
    let active = true;
    listAdmins()
      .then((r) => { if (active) setAdmins(r); })
      .catch((e: unknown) => { if (active) setMsg({ text: e instanceof Error ? e.message : 'Erro ao carregar.', ok: false }); });
    return () => { active = false; };
  }, []);

  const onSubmit = async (v: AdminUserValues) => {
    try {
      await createAdmin(v.email, v.password);
      reset();
      setMsg({ text: 'Administrador cadastrado. Informe a senha a essa pessoa por um canal seguro.', ok: true });
      await load();
    } catch (e) { setMsg({ text: e instanceof Error ? e.message : 'Não foi possível cadastrar.', ok: false }); }
  };

  const remove = async (a: AdminUser) => {
    if (!window.confirm(`Remover o acesso de ${a.email}?`)) return;
    try { await removeAdmin(a.user_id); setMsg({ text: 'Acesso removido.', ok: true }); await load(); }
    catch (e) { setMsg({ text: e instanceof Error ? e.message : 'Não foi possível remover.', ok: false }); }
  };

  return (
    <>
      <AdminBar />
      <main id="conteudo" className="container page">
        <h1 className="h2" style={{ marginBottom: 'var(--space-5)' }}>Administradores</h1>
        {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'ed-toast' : 'ed-toast ed-toast--err'}>{msg.text}</p>}
        <form className="form" style={{ maxWidth: '32rem', marginBlock: 'var(--space-5)' }} onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate aria-label="Novo administrador">
          <h2 style={{ fontSize: '1.5rem' }}>Cadastrar novo administrador</h2>
          <div className="field">
            <label htmlFor="a-email">E-mail</label>
            <input id="a-email" className="input" type="email" autoComplete="off" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <span className="field__error" role="alert">{errors.email.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="a-pass">Senha inicial</label>
            <PasswordInput id="a-pass" autoComplete="new-password" aria-invalid={!!errors.password} {...register('password')} />
            <span className="field__hint">Mínimo de 12 caracteres, com maiúsculas, minúsculas e números.</span>
            {errors.password && <span className="field__error" role="alert">{errors.password.message}</span>}
          </div>
          <button type="submit" className="btn btn--magenta" disabled={isSubmitting}>{isSubmitting ? 'Cadastrando…' : 'Cadastrar'}</button>
        </form>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-3)' }}>Quem tem acesso</h2>
        {admins === null ? <p className="status" role="status">Carregando…</p> : (
          <div className="table-wrap">
          <table className="table">
            <thead><tr><th>E-mail</th><th>Desde</th><th><span className="sr-only">Ações</span></th></tr></thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.user_id}>
                  <td>{a.email}{a.user_id === session?.user.id ? ' (você)' : ''}</td>
                  <td>{new Date(a.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>{a.user_id !== session?.user.id && <button type="button" className="btn btn--outline btn--small" onClick={() => void remove(a)}>Remover acesso</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </main>
    </>
  );
}
