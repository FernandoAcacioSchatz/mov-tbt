import { z } from 'zod';
import { optionalImage, optionalText, requiredImage, requiredText } from './common';
import { LOCAL_IMAGE_RE } from '../utils/url';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.');
const precision = z.enum(['day', 'month', 'year'], { error: 'Escolha a precisão da data.' });

const photoUrl = z.string().trim().refine(
  (v) => /^https:\/\/[^\s]+$/i.test(v) || (LOCAL_IMAGE_RE.test(v) && !v.includes('..')),
  'Foto com endereço inválido.',
);

/* A regra "de 2004 até hoje" é conferida no envio do formulário (só ao criar ou ao mudar a data)
   e também no banco. Aqui fica só o formato. */

export const historyPostSchema = z.object({
  title: requiredText(200, 'Título'),
  event_date: isoDate,
  date_precision: precision,
  date_label: optionalText(150),
  group_name: optionalText(150),
  city: optionalText(80),
  venue: optionalText(150),
  body: optionalText(20000),
  cover_url: optionalImage,
  photos: z.array(photoUrl).max(80, 'Máximo de 80 fotos.'),
  published: z.boolean(),
});
export type HistoryPostValues = z.input<typeof historyPostSchema>;

export const historyFlyerSchema = z.object({
  event_date: isoDate,
  date_precision: precision,
  image_url: requiredImage,
  caption: optionalText(200),
});
export type HistoryFlyerValues = z.input<typeof historyFlyerSchema>;

export const historyClippingSchema = z.object({
  event_date: isoDate,
  date_precision: precision,
  image_url: requiredImage,
  newspaper: optionalText(120),
  caption: optionalText(200),
});
export type HistoryClippingValues = z.input<typeof historyClippingSchema>;
