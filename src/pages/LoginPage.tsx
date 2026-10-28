import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginValues } from '../schemas/authSchemas';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PasswordInput } from '../components/ui/PasswordInput';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

export function LoginPage() {
  useDocumentTitle('Entrar — Movimento TBT');
  const { signIn, isAdmin, session, loading } = useAuth();
  const navigate = useNavigate();
  const passwordChanged = (useLocation().state as { passwordChanged?: boolean } | null)?.passwordChanged === true;
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  useEffect(() => { if (!loading && session && isAdmin) navigate('/admin', { replace: true }); }, [loading, session, isAdmin, navigate]);
  useEffect(() => {
    if (lockedUntil <= Date.now()) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  const remaining = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const locked = remaining > 0;

  const onSubmit = async (v: LoginValues) => {
    if (locked) return;
    setError(null);
    try {
      await signIn(v.email, v.password);
      setFailures(0);
    } catch (e) {
      const next = failures + 1;
      setFailures(next);
      if (next >= MAX_ATTEMPTS) { setLockedUntil(Date.now() + LOCK_SECONDS * 1000); setNow(Date.now()); setFailures(0); }
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    }
  };

  const loggedNotAdmin = !loading && session && !isAdmin;

  return (
    <main id="conteudo" className="container page">
      <div className="login">
        <h1 className="h2" style={{ marginBottom: 'var(--space-5)' }}>Entrar</h1>
        <form className="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate aria-label="Login da administração">
          <div className="field">
            <label htmlFor="l-email">E-mail</label>
            <input id="l-email" className="input" type="email" autoComplete="username" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <span className="field__error" role="alert">{errors.email.message}</span>}
          </div>
          <div className="field">
            <label htmlFor="l-pass">Senha</label>
            <PasswordInput id="l-pass" autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')} />
            {errors.password && <span className="field__error" role="alert">{errors.password.message}</span>}
          </div>
          {passwordChanged && <p className="ed-toast" role="status">Senha alterada. Entre com a sua nova senha.</p>}
          {locked && <div className="form__error" role="alert">Muitas tentativas. Aguarde {remaining}s para tentar de novo.</div>}
          {!locked && error && <div className="form__error" role="alert">{error}</div>}
          {loggedNotAdmin && <div className="form__error" role="alert">Esta conta não tem permissão de administrador.</div>}
          <button type="submit" className="btn btn--magenta btn--lg" disabled={isSubmitting || locked}>{isSubmitting ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <p className="login__links">
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
          <Link to="/">← Voltar ao site</Link>
        </p>
      </div>
    </main>
  );
}
