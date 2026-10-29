import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageField } from './ImageField';
import { HistoryDateField } from './HistoryDateField';
import { PhotosField } from './PhotosField';
import { historyClippingSchema, historyFlyerSchema, historyMediaSchema, historyPostSchema, MEDIA_TYPES } from '../schemas/historySchemas';
import { MEDIA_TYPE_LABEL } from '../components/history/historyUtils';
import { historyDateProblem, normalizeToPrecision, slugify, todayBR, type DatePrecision } from '../utils/dates';
import { HISTORY_TABLES, saveHistoryItem } from '../services/historyService';
import type { HistoryClipping, HistoryFlyer, HistoryKind, HistoryMedia, HistoryPost } from '../types/content';

type Values = Record<string, unknown>;
export type HistoryRow = HistoryPost | HistoryFlyer | HistoryClipping | HistoryMedia;

export const NEW_LABEL: Record<HistoryKind, string> = { postagens: 'Nova postagem', filipetas: 'Nova filipeta', clipagens: 'Nova clipagem', midia: 'Nova postagem na mídia' };
const ONE_LABEL: Record<HistoryKind, string> = { postagens: 'postagem', filipetas: 'filipeta', clipagens: 'clipagem', midia: 'postagem na mídia' };

const SCHEMAS = { postagens: historyPostSchema, filipetas: historyFlyerSchema, clipagens: historyClippingSchema, midia: historyMediaSchema };

function defaults(kind: HistoryKind, year: number, row?: HistoryRow): Values {
  const today = todayBR();
  const baseDate = String(year) === today.slice(0, 4) ? today : `${year}-01-01`;
  const precision: DatePrecision = kind === 'filipetas' ? 'year' : 'day';
  const common = { event_date: normalizeToPrecision(baseDate, precision), date_precision: precision };
  const pick = (r: Record<string, unknown> | undefined, keys: string[]) => Object.fromEntries(keys.map((k) => [k, r?.[k] ?? '']));
  const r = row as unknown as Record<string, unknown> | undefined;
  if (kind === 'postagens') {
    return {
      ...common, title: '', date_label: '', group_name: '', city: '', venue: '', body: '', cover_url: '', photos: [], published: true,
      ...(r ? { ...pick(r, ['title', 'event_date', 'date_precision', 'date_label', 'group_name', 'city', 'venue', 'body', 'cover_url']), photos: (r.photos as string[]) ?? [], published: r.published !== false } : {}),
    };
  }
  if (kind === 'midia') {
    return {
      ...common, title: '', media_type: 'materia', outlet: '', url: '', video_url: '', image_url: '', body: '', photos: [], published: true,
      ...(r ? { ...pick(r, ['title', 'media_type', 'outlet', 'event_date', 'date_precision', 'url', 'video_url', 'image_url', 'body']), photos: (r.photos as string[]) ?? [], published: r.published !== false } : {}),
    };
  }
  if (kind === 'filipetas') return { ...common, image_url: '', caption: '', ...(r ? pick(r, ['event_date', 'date_precision', 'image_url', 'caption']) : {}) };
  return { ...common, image_url: '', newspaper: '', caption: '', ...(r ? pick(r, ['event_date', 'date_precision', 'image_url', 'newspaper', 'caption']) : {}) };
}

/** Formulário de UM tipo de item da História (postagem, filipeta, clipagem ou na mídia). */
export function HistoryItemForm({ kind, year, row, onDone, onCancel }: {
  kind: HistoryKind;
  year: number;
  row?: HistoryRow;
  onDone: (savedYear: number, msg: string) => void;
  onCancel: () => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(SCHEMAS[kind] as never) as unknown as Resolver<Values>,
    defaultValues: defaults(kind, year, row),
  });
  const { register, handleSubmit, control, setValue, setError, formState: { errors, isSubmitting } } = form;
  const err = (name: string) => errors[name]?.message as string | undefined;
  const id = `h-${kind}`;

  const onSubmit = async (values: Values) => {
    const date = normalizeToPrecision(String(values.event_date), values.date_precision as DatePrecision);
    // Regra de data: conferida ao cadastrar e quando a data muda (editar outros campos não esbarra nela).
    if (!row || date !== row.event_date) {
      const problem = historyDateProblem(date);
      if (problem) { setError('event_date', { message: problem }); return; }
    }
    const payload: Values = { ...values, event_date: date };
    // Endereço da postagem: título + ano-mês (o mesmo espetáculo pode ter mais de uma temporada no ano).
    if (kind === 'postagens' && !row) payload.slug = `${slugify(String(values.title))}-${date.slice(0, 7)}`;
    try {
      await saveHistoryItem(HISTORY_TABLES[kind], row?.id ?? null, payload);
      const msg = kind === 'midia'
        ? (row ? `Salvo. Mídias e História de ${date.slice(0, 4)} já foram atualizadas.` : `Cadastrado. Já aparece em Mídias e na História de ${date.slice(0, 4)}.`)
        : (row ? 'Salvo. A História já foi atualizada.' : 'Cadastrado. Já aparece na História, na posição da data.');
      onDone(Number(date.slice(0, 4)), msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Não foi possível salvar.';
      setError('root', { message: msg.includes('já existe') ? 'Já existe uma postagem com esse título nesse ano. Mude o título.' : msg });
    }
  };

  const text = (name: string, label: string, opts: { area?: number; hint?: string } = {}) => (
    <div className="field">
      <label htmlFor={`${id}-${name}`}>{label}</label>
      {opts.area
        ? <textarea id={`${id}-${name}`} className="input" rows={opts.area} aria-invalid={!!err(name)} {...register(name)} />
        : <input id={`${id}-${name}`} className="input" type="text" aria-invalid={!!err(name)} {...register(name)} />}
      {opts.hint && <span className="field__hint">{opts.hint}</span>}
      {err(name) && <span className="field__error" role="alert">{err(name)}</span>}
    </div>
  );
  const image = (name: string, label: string) => (
    <ImageField id={`${id}-${name}`} label={label} register={register(name)} control={control} name={name} error={err(name)}
      onUploaded={(url) => setValue(name, url, { shouldValidate: true, shouldDirty: true })} />
  );

  return (
    <form className="ed-form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate aria-label={row ? `Editar ${kind}` : NEW_LABEL[kind]}>
      <h3>{row ? `Editar ${ONE_LABEL[kind]}` : NEW_LABEL[kind]}</h3>

      {kind === 'postagens' && text('title', 'Título (ex.: Sujos — Grupo K - Teatro)')}
      {kind === 'midia' && (
        <>
          {text('title', 'Título (ex.: Temporada de teatro movimenta Blumenau)')}
          <div className="field">
            <label htmlFor={`${id}-media_type`}>Tipo</label>
            <select id={`${id}-media_type`} className="input" {...register('media_type')}>
              {MEDIA_TYPES.map((m) => <option key={m} value={m}>{MEDIA_TYPE_LABEL[m]}</option>)}
            </select>
          </div>
          {text('outlet', 'Veículo (ex.: Jornal de Santa Catarina, NSC TV, Instagram)')}
        </>
      )}
      {(kind === 'filipetas' || kind === 'clipagens') && image('image_url', kind === 'filipetas' ? 'Imagem da filipeta' : 'Imagem do recorte de jornal')}

      <HistoryDateField idPrefix={id} control={control} setValue={setValue} error={err('event_date')} />

      {kind === 'postagens' && (
        <>
          {text('date_label', 'Data por extenso (opcional)', { hint: 'Ex.: 08 a 12 de março de 2006. Aparece no lugar da data simples.' })}
          {text('group_name', 'Grupo ou companhia')}
          {text('city', 'Cidade (ex.: Blumenau/SC)')}
          {text('venue', 'Local (ex.: Fundação Cultural de Blumenau)')}
          {text('body', 'Texto completo (sinopse, ficha técnica…)', { area: 12, hint: 'Deixe uma linha em branco entre parágrafos.' })}
          {image('cover_url', 'Imagem de capa')}
          <PhotosField id={id} control={control} setValue={setValue} error={err('photos')} />
          <div className="field">
            <label className="check" htmlFor={`${id}-published`}><input id={`${id}-published`} type="checkbox" {...register('published')} /><span>Publicada no site</span></label>
          </div>
        </>
      )}
      {kind === 'midia' && (
        <>
          {text('url', 'Link da publicação (opcional)', { hint: 'Endereço da matéria, do post ou da página. Comece com https://' })}
          {text('video_url', 'Link do vídeo (opcional)', { hint: 'YouTube, Instagram etc. Com YouTube, a capa sai sozinha se você não enviar uma imagem.' })}
          {image('image_url', 'Imagem de capa (opcional)')}
          {text('body', 'Texto (resumo, trecho da matéria…)', { area: 6, hint: 'Deixe uma linha em branco entre parágrafos.' })}
          <PhotosField id={id} control={control} setValue={setValue} error={err('photos')} />
          <div className="field">
            <label className="check" htmlFor={`${id}-published`}><input id={`${id}-published`} type="checkbox" {...register('published')} /><span>Publicada no site</span></label>
          </div>
        </>
      )}
      {kind === 'filipetas' && text('caption', 'Legenda (opcional — ex.: Março — Amar e Mesmo Assim)')}
      {kind === 'clipagens' && (
        <>
          {text('newspaper', 'Jornal (ex.: Jornal de Santa Catarina)')}
          {text('caption', 'Legenda (ex.: Espetáculo Sujos — Grupo K)')}
        </>
      )}

      {errors.root?.message && <p className="form__error" role="alert">{errors.root.message}</p>}
      <div className="ed-actions">
        <button type="submit" className="btn btn--magenta" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</button>
        <button type="button" className="btn btn--outline" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
