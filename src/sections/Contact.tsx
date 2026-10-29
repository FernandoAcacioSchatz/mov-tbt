import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTexts } from '../hooks/useTexts';
import { EditButton } from '../components/ui/EditButton';
import { contactSchema, type ContactFormValues } from '../schemas/contactSchema';
import { sendContactMessage } from '../services/contactService';
import { CONTACT_SUBJECTS } from '../types/content';
import { WHATSAPP_PATH } from '../assets/socials';

/** Ícones de traço simples (viewBox 0 0 24 24) para os contatos diretos. */
const ICON_MAIL = <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
const ICON_PIN = <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
const ICON_WHATSAPP = <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d={WHATSAPP_PATH} fill="currentColor" /></svg>;

/** Número do WhatsApp só com dígitos, com o 55 do Brasil quando vier sem código do país. */
function whatsappDigits(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
}

export function Contact() {
  const t = useTexts();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: CONTACT_SUBJECTS[0], message: '', consent: false, website: '' },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setServerError(null);
    // Robô preencheu o campo-armadilha: finge sucesso e não envia nada.
    if (values.website) { setSent(true); return; }
    try {
      await sendContactMessage({ name: values.name, email: values.email, subject: values.subject, message: values.message });
      setSent(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Não foi possível enviar sua mensagem agora.');
    }
  };

  // Contatos diretos (Editar → Contato); cada um só aparece se estiver preenchido.
  const email = t('contatoEmail').trim();
  const whats = t('contatoWhatsapp').trim();
  const local = t('contatoLocal').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const whatsNum = whatsappDigits(whats);

  const err = (key: keyof ContactFormValues) => errors[key]?.message as string | undefined;

  return (
    <section id="contato" className="section" aria-labelledby="contato-title">
      <EditButton section="contato" />
      <div className="container contact">
        <div className="contact__info">
          <h2 id="contato-title" className="h2">{t('contatoTitle')}</h2>
          <p className="lead">{t('contatoText')}</p>
          {(validEmail || whatsNum.length >= 12 || local) && (
            <ul className="contact__direct">
              {validEmail && (
                <li><a className="contact__item" href={`mailto:${email}`}><span className="contact__icon" style={{ background: 'var(--color-yellow)' }}>{ICON_MAIL}</span><span><small>E-mail</small>{email}</span></a></li>
              )}
              {whatsNum.length >= 12 && (
                <li><a className="contact__item" href={`https://wa.me/${whatsNum}`} target="_blank" rel="noopener noreferrer"><span className="contact__icon" style={{ background: 'var(--color-teal)' }}>{ICON_WHATSAPP}</span><span><small>WhatsApp</small>{whats}</span></a></li>
              )}
              {local && (
                <li><div className="contact__item"><span className="contact__icon" style={{ background: 'var(--color-pink)' }}>{ICON_PIN}</span><span><small>Onde estamos</small>{local}</span></div></li>
              )}
            </ul>
          )}
        </div>

        <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Formulário de contato">
          {sent ? (
            <div className="form__ok" role="status">
              <h3>Obrigado pelo envio!</h3>
              <p>Recebemos sua mensagem e respondemos em breve.</p>
            </div>
          ) : (
            <>
              <div className="form__row">
              <div className="field">
                <label htmlFor="f-nome">Nome</label>
                <input id="f-nome" className="input" type="text" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'f-nome-err' : undefined} {...register('name')} />
                {errors.name && <span id="f-nome-err" className="field__error" role="alert">{err('name')}</span>}
              </div>
              <div className="field">
                <label htmlFor="f-email">E-mail</label>
                <input id="f-email" className="input" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'f-email-err' : undefined} {...register('email')} />
                {errors.email && <span id="f-email-err" className="field__error" role="alert">{err('email')}</span>}
              </div>
              </div>
              <div className="field">
                <label htmlFor="f-assunto">Assunto</label>
                <select id="f-assunto" className="input" aria-invalid={!!errors.subject} {...register('subject')}>
                  {CONTACT_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.subject && <span className="field__error" role="alert">{err('subject')}</span>}
              </div>
              <div className="field">
                <label htmlFor="f-msg">Mensagem</label>
                <textarea id="f-msg" className="input" rows={5} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'f-msg-err' : undefined} {...register('message')} />
                {errors.message && <span id="f-msg-err" className="field__error" role="alert">{err('message')}</span>}
              </div>

              {/* Campo-armadilha: invisível para pessoas */}
              <div className="hp" aria-hidden="true">
                <label htmlFor="f-site">Não preencha este campo</label>
                <input id="f-site" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
              </div>

              <div className="field">
                <label className="check" htmlFor="f-consent">
                  <input id="f-consent" type="checkbox" aria-invalid={!!errors.consent} {...register('consent')} />
                  <span>Li e aceito a <Link to="/privacidade">Política de Privacidade</Link> e autorizo o uso dos meus dados para responder esta mensagem.</span>
                </label>
                {errors.consent && <span className="field__error" role="alert">{err('consent')}</span>}
              </div>

              {serverError && <div className="form__error" role="alert">{serverError}</div>}
              <button type="submit" className="btn btn--magenta btn--lg" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando…' : 'Enviar mensagem'}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
