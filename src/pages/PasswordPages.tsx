import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { newPasswordSchema, recoverSchema, type NewPasswordValues, type RecoverValues } from '../schemas/authSchemas';
import { requestPasswordReset, startRecoveryFromUrl, updatePasswordAndSignOutEverywhere, type RecoveryResult } from '../services/authService';
import { PasswordInput } from '../components/ui/PasswordInput';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const COOLDOWN_S = 60;
const COOLDOWN_KEY = 'tbt-recover-at';

function readLast(): number {
  try { return Number(localStorage.getItem(COOLDOWN_KEY)) || 0; } catch { return 0; }
}

/** /recuperar-senha — pede o link por e-mail. A resposta é sempre a mesma (não revela se o e-mail existe). */
export function RecoverPasswordPage() {
  useDocumentTitle('Recuperar senha — Movimento TBT');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [last, setLast] = useState(readLast);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RecoverValues>({ resolver: zodResolver(recoverSchema), defaultValues: { email: '' } });

  const remaining = Math.max(0, Math.ceil((last + COOLDOWN_S * 1000 - now) / 1000));
  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [remaining]);

  const onSubmit = async (v: RecoverValues) => {
    if (remaining > 0) return;
    setError(null);
    try {
      await requestPasswordReset(v.email);
      const t = Date.now();
      try { localStorage.setItem(COOLDOWN_KEY, String(t)); } catch { /* sem armazenamento: só a espera da tela */ }
      setLast(t); setNow(t); setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar agora.');
    }
  };

  return (
    <main id="conteudo" className="container page">
      <div className="login">
        <h1 className="h2" style={{ marginBottom: 'var(--space-5)' }}>Recuperar senha</h1>
        <form className="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate aria-label="Recuperar senha">
          <p className="ed-hint">Informe o e-mail da sua conta de administrador. Enviaremos um link para você criar uma senha nova. O link vale por pouco tempo e só pode ser usado uma vez.</p>
          <div className="field">
            <label htmlFor="r-email">E-mail</label>
            <input id="r-email" className="input" type="email" autoComplete="username" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <span className="field__error" role="alert">{errors.email.message}</span>}
          </div>
          {sent && (
            <p className="ed-toast" role="status">
              Se esse e-mail estiver cadastrado, você vai receber o link em instantes. Confira também a caixa de spam.
            </p>
          )}
          {error && <p className="form__error" role="alert">{error}</p>}
          <button type="submit" className="btn btn--magenta btn--lg" disabled={isSubmitting || remaining > 0}>
            {isSubmitting ? 'Enviando…' : remaining > 0 ? `Aguarde ${remaining}s para pedir de novo` : 'Enviar link'}
          </button>
        </form>
        <p style={{ marginTop: 'var(--space-5)' }}><Link to="/login">← Voltar ao login</Link></p>
      </div>
    </main>
  );
}

const REASON: Record<Exclude<RecoveryResult, { ok: true }>['reason'], string> = {
  expired: 'Este link expirou. Peça um novo link de recuperação.',
  invalid: 'Este link não é válido ou já foi usado. Peça um novo link de recuperação.',
  missing: 'Abra esta página pelo link enviado ao seu e-mail.',
};

/** /redefinir-senha — aberta pelo link do e-mail; cria a nova senha e encerra todas as sessões. */
export function ResetPasswordPage() {
  useDocumentTitle('Nova senha — Movimento TBT');
  const navigate = useNavigate();
  const [state, setState] = useState<RecoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema), defaultValues: { password: '', confirm: '' } });

  useEffect(() => {
    let active = true;
    void startRecoveryFromUrl().then((r) => { if (active) setState(r); });
    return () => { active = false; };
  }, []);

  const onSubmit = async (v: NewPasswordValues) => {
    setError(null);
    try {
      await updatePasswordAndSignOutEverywhere(v.password);
      navigate('/login', { replace: true, state: { passwordChanged: true } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível trocar a senha.');
    }
  };

  return (
    <main id="conteudo" className="container page">
      <div className="login">
        <h1 className="h2" style={{ marginBottom: 'var(--space-5)' }}>Criar nova senha</h1>
        {state === null && <p className="status" role="status">Verificando o link…</p>}
        {state && !state.ok && (
          <div className="form">
            <p className="form__error" role="alert">{REASON[state.reason]}</p>
            <Link className="btn btn--magenta" to="/recuperar-senha">Pedir novo link</Link>
          </div>
        )}
        {state?.ok && (
          <form className="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate aria-label="Criar nova senha">
            <div className="field">
              <label htmlFor="n-pass">Nova senha</label>
              <PasswordInput id="n-pass" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby="n-pass-hint" {...register('password')} />
              <span id="n-pass-hint" className="field__hint">Mínimo de 12 caracteres, com letras maiúsculas, minúsculas e números.</span>
              {errors.password && <span className="field__error" role="alert">{errors.password.message}</span>}
            </div>
            <div className="field">
              <label htmlFor="n-confirm">Repita a nova senha</label>
              <PasswordInput id="n-confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register('confirm')} />
              {errors.confirm && <span className="field__error" role="alert">{errors.confirm.message}</span>}
            </div>
            {error && <p className="form__error" role="alert">{error}</p>}
            <p className="ed-hint">Por segurança, depois da troca todas as sessões abertas (em qualquer aparelho) serão encerradas e você entra de novo com a senha nova.</p>
            <button type="submit" className="btn btn--magenta btn--lg" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar nova senha'}</button>
          </form>
        )}
      </div>
    </main>
  );
}
