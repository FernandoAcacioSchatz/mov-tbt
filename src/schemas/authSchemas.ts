import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('E-mail inválido.')),
  password: z.string().min(1, 'Informe a senha.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const passwordRule = z
  .string()
  .min(12, 'A senha precisa ter pelo menos 12 caracteres.')
  .max(128, 'Senha muito longa.')
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v) && /\d/.test(v), 'Use letras maiúsculas, minúsculas e números.');

export const adminUserSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('E-mail inválido.')),
  password: passwordRule,
});
export type AdminUserValues = z.infer<typeof adminUserSchema>;

export const recoverSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('E-mail inválido.')),
});
export type RecoverValues = z.infer<typeof recoverSchema>;

export const newPasswordSchema = z
  .object({ password: passwordRule, confirm: z.string().min(1, 'Repita a nova senha.') })
  .refine((v) => v.password === v.confirm, { message: 'As senhas não são iguais.', path: ['confirm'] });
export type NewPasswordValues = z.infer<typeof newPasswordSchema>;
