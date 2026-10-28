import { describe, expect, it } from 'vitest';
import { contactSchema } from './contactSchema';
import { adminUserSchema, loginSchema } from './authSchemas';
import { memberSchema, showSchema, videoSchema } from './resourceSchemas';

const validContact = { name: 'Maria', email: 'maria@exemplo.com', subject: 'Tenho uma sugestão', message: 'Olá, gostaria de saber mais.', consent: true, website: '' };

describe('contactSchema', () => {
  it('aceita dados válidos', () => { expect(contactSchema.safeParse(validContact).success).toBe(true); });
  it('exige consentimento', () => { expect(contactSchema.safeParse({ ...validContact, consent: false }).success).toBe(false); });
  it('rejeita e-mail inválido', () => { expect(contactSchema.safeParse({ ...validContact, email: 'x' }).success).toBe(false); });
  it('rejeita mensagem curta e longa demais', () => {
    expect(contactSchema.safeParse({ ...validContact, message: 'oi' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validContact, message: 'a'.repeat(2001) }).success).toBe(false);
  });
  it('rejeita assunto fora da lista', () => { expect(contactSchema.safeParse({ ...validContact, subject: 'Outro' }).success).toBe(false); });
  it('deixa a armadilha passar para o formulário fingir sucesso (robô)', () => {
    const r = contactSchema.safeParse({ ...validContact, website: 'http://spam' });
    expect(r.success && r.data.website).toBe('http://spam');
  });
});

describe('auth schemas', () => {
  it('login exige e-mail e senha', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
  it('senha de administrador tem regra forte', () => {
    expect(adminUserSchema.safeParse({ email: 'a@b.com', password: 'curta1A' }).success).toBe(false);
    expect(adminUserSchema.safeParse({ email: 'a@b.com', password: 'semnumeroMAIUSC' }).success).toBe(false);
    expect(adminUserSchema.safeParse({ email: 'a@b.com', password: 'SenhaForte12345' }).success).toBe(true);
  });
});

describe('resource schemas', () => {
  it('espetáculo converte vazios em null e valida data', () => {
    const r = showSchema.safeParse({ title: 'Peça', group_name: '', date: '2026-05-01', time: '', place: '', price: '', image_url: '', description: '', published: true });
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.time).toBeNull(); expect(r.data.image_url).toBeNull(); }
    expect(showSchema.safeParse({ title: 'Peça', date: '01/05/2026', published: true, group_name: '', time: '', place: '', price: '', image_url: '', description: '' }).success).toBe(false);
  });
  it('bloqueia links javascript: e http', () => {
    expect(videoSchema.safeParse({ title: 'v', who: '', href: 'javascript:alert(1)' }).success).toBe(false);
    expect(videoSchema.safeParse({ title: 'v', who: '', href: 'http://inseguro.com' }).success).toBe(false);
    expect(videoSchema.safeParse({ title: 'v', who: '', href: 'https://youtu.be/x' }).success).toBe(true);
  });
  it('integrante exige nome', () => {
    expect(memberSchema.safeParse({ name: ' ', role: '', bio: '', photo_url: '', link_url: '', link_label: '' }).success).toBe(false);
  });
});

describe('recuperação de senha', () => {
  it('nova senha precisa ser forte e repetida igual', async () => {
    const { newPasswordSchema } = await import('./authSchemas');
    expect(newPasswordSchema.safeParse({ password: 'SenhaForte12345', confirm: 'SenhaForte12345' }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: 'SenhaForte12345', confirm: 'SenhaForte1234' }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: 'fraca', confirm: 'fraca' }).success).toBe(false);
  });
});
