import { z } from 'zod';
import { LOCAL_IMAGE_RE } from '../utils/url';

const httpsUrl = z
  .string()
  .trim()
  .max(2000, 'Endereço muito longo.')
  .refine((v) => /^https:\/\/[^\s]+$/i.test(v), 'Use um endereço que comece com https://');

/** Imagem: endereço https:// ou arquivo do próprio site (/images/…). */
const imageUrl = z
  .string()
  .trim()
  .max(500, 'Endereço muito longo.')
  .refine((v) => /^https:\/\/[^\s]+$/i.test(v) || (LOCAL_IMAGE_RE.test(v) && !v.includes('..')), 'Use um endereço que comece com https:// ou /images/');

/** Endereço opcional: vazio vira null. */
export const optionalUrl = z
  .union([z.literal(''), httpsUrl])
  .transform((v) => (v === '' ? null : v));

export const requiredUrl = httpsUrl;

export const optionalImage = z
  .union([z.literal(''), imageUrl])
  .transform((v) => (v === '' ? null : v));

export const requiredImage = imageUrl;

export const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres.`).transform((v) => (v === '' ? null : v));

export const requiredText = (max: number, label = 'Campo') =>
  z.string().trim().min(1, `${label} é obrigatório.`).max(max, `Máximo de ${max} caracteres.`);
