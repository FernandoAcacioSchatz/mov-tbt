import { z } from 'zod';
import { CONTACT_SUBJECTS } from '../types/content';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(120, 'Nome muito longo.'),
  email: z.string().trim().min(1, 'Informe seu e-mail.').max(200, 'E-mail muito longo.').pipe(z.email('E-mail inválido.')),
  subject: z.enum(CONTACT_SUBJECTS, { error: 'Escolha um assunto.' }),
  message: z.string().trim().min(10, 'Escreva pelo menos 10 caracteres.').max(2000, 'Máximo de 2000 caracteres.'),
  consent: z.boolean().refine((v) => v === true, 'É necessário aceitar a Política de Privacidade.'),
  /** Campo-armadilha para robôs: pessoas nunca o veem nem preenchem. Se vier preenchido, o formulário finge sucesso e não envia. */
  website: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
