import { z } from 'zod';
import { optionalImage, optionalText, optionalUrl, requiredImage, requiredText, requiredUrl } from './common';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.');
const optionalTime = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{2}:\d{2}$/.test(v), 'Use o formato HH:MM.')
  .transform((v) => (v === '' ? null : v));

export const showSchema = z.object({
  title: requiredText(200, 'Título'),
  group_name: optionalText(200),
  date: isoDate,
  time: optionalTime,
  place: optionalText(200),
  price: optionalText(100),
  image_url: optionalImage,
  description: optionalText(2000),
  published: z.boolean(),
});

export const memberSchema = z.object({
  name: requiredText(150, 'Nome'),
  role: optionalText(150),
  bio: optionalText(2000),
  photo_url: optionalImage,
  link_url: optionalUrl,
  link_label: optionalText(80),
});

export const videoSchema = z.object({
  title: requiredText(200, 'Título'),
  who: optionalText(200),
  href: requiredUrl,
  cover_url: optionalImage.optional(),
});

export const podcastSchema = z.object({
  n: optionalText(20),
  title: requiredText(200, 'Título'),
  href: requiredUrl,
});

export const photoSchema = z.object({
  caption: requiredText(200, 'Legenda'),
  taken_when: optionalText(100),
  src: requiredImage,
});

/** Limite de cada texto do site (o banco aplica o mesmo limite). */
export const TEXT_MAX = 5000;
export const textValueSchema = z.string().max(TEXT_MAX, `Máximo de ${TEXT_MAX} caracteres.`);
