import type { ZodType } from 'zod';
import type { SectionKey } from '../hooks/useEditMode';
import type { ResourceTable } from '../types/content';
import { showDateProblem } from '../utils/dates';
import { memberSchema, photoSchema, podcastSchema, showSchema, videoSchema } from '../schemas/resourceSchemas';

/** i = linha · a = texto curto · A = texto longo · img = imagem (endereço; vazio = a imagem original do site) */
export interface TextField { key: string; label: string; kind: 'i' | 'a' | 'A' | 'img' }

export type FieldKind = 'text' | 'textarea' | 'date' | 'time' | 'url' | 'image' | 'select' | 'checkbox';
export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  help?: string;
  autoFocus?: boolean;
}

export interface ResourceDef {
  table: ResourceTable;
  label: string;
  newLabel: string;
  hint: string;
  schema: ZodType;
  fields: FieldDef[];
  /** true quando a lista tem ordem manual (↑↓) */
  ordered: boolean;
  /** Regra da data (campo "date"), conferida ao criar e quando a data muda. Devolve a mensagem de erro ou null. */
  dateRule?: (iso: string) => string | null;
  defaults: Record<string, unknown>;
}

export interface SectionDef {
  title: string;
  texts: TextField[];
  resources: ResourceTable[];
}

export const RESOURCES: Record<ResourceTable, ResourceDef> = {
  shows: {
    table: 'shows', label: 'Espetáculos', newLabel: '+ Novo espetáculo', ordered: false, dateRule: (d) => showDateProblem(d),
    hint: 'Próximas apresentações: a data precisa ser de hoje em diante. Para registrar algo que já aconteceu, use a História. Desmarque “Publicado” para esconder sem excluir.',
    schema: showSchema,
    defaults: { title: '', group_name: '', date: '', time: '', place: '', price: 'Chapéu consciente', image_url: '', description: '', published: true },
    fields: [
      { name: 'title', label: 'Título', kind: 'text', autoFocus: true },
      { name: 'group_name', label: 'Grupo ou coletivo', kind: 'text' },
      { name: 'date', label: 'Data', kind: 'date' },
      { name: 'time', label: 'Horário', kind: 'time' },
      { name: 'place', label: 'Local', kind: 'text' },
      { name: 'price', label: 'Valor / entrada', kind: 'text' },
      { name: 'image_url', label: 'Imagem', kind: 'image' },
      { name: 'description', label: 'Descrição', kind: 'textarea' },
      { name: 'published', label: 'Publicado no site', kind: 'checkbox' },
    ],
  },
  members: {
    table: 'members', label: 'Integrantes', newLabel: '+ Novo integrante', ordered: true,
    hint: 'Use ↑ ↓ para mudar a ordem no carrossel.',
    schema: memberSchema,
    defaults: { name: '', role: '', bio: '', photo_url: '', link_url: '', link_label: '' },
    fields: [
      { name: 'name', label: 'Nome', kind: 'text', autoFocus: true },
      { name: 'role', label: 'Função', kind: 'text' },
      { name: 'bio', label: 'Mini biografia', kind: 'textarea' },
      { name: 'photo_url', label: 'Foto', kind: 'image' },
      { name: 'link_url', label: 'Link (opcional)', kind: 'url', help: 'Comece com https://' },
      { name: 'link_label', label: 'Texto do link', kind: 'text' },
    ],
  },
  videos: {
    table: 'videos', label: 'Vídeos', newLabel: '+ Novo vídeo', ordered: true,
    hint: 'Cole o endereço do vídeo (YouTube etc.). A capa é opcional: sem ela, o site usa a imagem do próprio YouTube. Use ↑ ↓ para ordenar.',
    schema: videoSchema,
    defaults: { title: '', who: '', href: '', cover_url: '' },
    fields: [
      { name: 'title', label: 'Título', kind: 'text', autoFocus: true },
      { name: 'who', label: 'Quem apresenta', kind: 'text' },
      { name: 'href', label: 'Endereço do vídeo', kind: 'url', help: 'Comece com https://' },
      { name: 'cover_url', label: 'Capa (opcional)', kind: 'image' },
    ],
  },
  podcasts: {
    table: 'podcasts', label: 'Podcasts', newLabel: '+ Novo podcast', ordered: true,
    hint: 'Use ↑ ↓ para ordenar.',
    schema: podcastSchema,
    defaults: { n: '', title: '', href: '' },
    fields: [
      { name: 'n', label: 'Número ou símbolo', kind: 'text' },
      { name: 'title', label: 'Título', kind: 'text', autoFocus: true },
      { name: 'href', label: 'Endereço para ouvir', kind: 'url', help: 'Comece com https://' },
    ],
  },
  photos: {
    table: 'photos', label: 'Fotos', newLabel: '+ Nova foto', ordered: true,
    hint: 'Use ↑ ↓ para ordenar. Envie uma imagem do computador ou cole um endereço.',
    schema: photoSchema,
    defaults: { caption: '', taken_when: '', src: '' },
    fields: [
      { name: 'caption', label: 'Legenda', kind: 'text', autoFocus: true },
      { name: 'taken_when', label: 'Quando', kind: 'text' },
      { name: 'src', label: 'Imagem', kind: 'image' },
    ],
  },
};

export const SECTIONS: Record<SectionKey, SectionDef> = {
  inicio: {
    title: 'Início',
    resources: [],
    texts: [
      { key: 'heroKicker', label: 'Frase pequena acima do título', kind: 'i' },
      { key: 'heroLine1', label: 'Título — linha 1', kind: 'i' },
      { key: 'heroLine2', label: 'Título — linha 2 (contorno)', kind: 'i' },
      { key: 'heroText', label: 'Texto de apresentação', kind: 'A' },
      { key: 'heroBtn1', label: 'Botão 1', kind: 'i' },
      { key: 'heroBtn2', label: 'Botão 2', kind: 'i' },
      { key: 'logoTopo', label: 'Logo do menu (topo de todas as páginas)', kind: 'img' },
      { key: 'heroFoto1', label: 'Foto 1 da faixa de fotos', kind: 'img' },
      { key: 'heroFoto2', label: 'Foto 2 da faixa de fotos', kind: 'img' },
      { key: 'heroFoto3', label: 'Foto 3 da faixa de fotos', kind: 'img' },
      { key: 'heroFoto4', label: 'Foto 4 da faixa de fotos', kind: 'img' },
      { key: 'heroFoto5', label: 'Foto 5 da faixa de fotos', kind: 'img' },
    ],
  },
  sobre: {
    title: 'Sobre',
    resources: [],
    texts: [
      { key: 'sobreTitle', label: 'Título', kind: 'i' },
      { key: 'sobreP1', label: 'Parágrafo 1', kind: 'A' },
      { key: 'sobreP2', label: 'Parágrafo 2', kind: 'A' },
      ...[1, 2, 3, 4].flatMap((n): TextField[] => [
        { key: `stat${n}v`, label: `Destaque ${n} — valor`, kind: 'i' },
        { key: `stat${n}l`, label: `Destaque ${n} — descrição`, kind: 'i' },
      ]),
    ],
  },
  agenda: {
    title: 'Agenda',
    resources: ['shows'],
    texts: [
      { key: 'agendaTitle', label: 'Título', kind: 'i' },
      { key: 'agendaText', label: 'Texto de apoio', kind: 'a' },
      { key: 'agendaVazioTitulo', label: 'Sem espetáculos em cartaz — título', kind: 'i' },
      { key: 'agendaVazioTexto', label: 'Sem espetáculos em cartaz — texto', kind: 'a' },
    ],
  },
  historia: {
    title: 'História',
    resources: [],
    texts: [
      { key: 'historiaTitle', label: 'Título', kind: 'i' },
    ],
  },
  midias: {
    title: 'Assista & ouça',
    resources: ['videos', 'podcasts', 'photos'],
    texts: [
      { key: 'midiasTitle', label: 'Título', kind: 'i' },
      { key: 'videosTitle', label: 'Título dos vídeos', kind: 'i' },
      { key: 'podcastsTitle', label: 'Título dos podcasts', kind: 'i' },
      { key: 'fotosTitle', label: 'Título das fotos', kind: 'i' },
    ],
  },
  integrantes: {
    title: 'Integrantes',
    resources: ['members'],
    texts: [
      { key: 'elencoTitle', label: 'Título', kind: 'i' },
    ],
  },
  contato: {
    title: 'Contato',
    resources: [],
    texts: [
      { key: 'contatoTitle', label: 'Título', kind: 'i' },
      { key: 'contatoText', label: 'Texto', kind: 'a' },
      { key: 'contatoEmail', label: 'E-mail de contato (deixe vazio para não mostrar)', kind: 'i' },
      { key: 'contatoWhatsapp', label: 'WhatsApp, com DDD, ex.: (47) 99999-9999 (deixe vazio para não mostrar)', kind: 'i' },
      { key: 'contatoLocal', label: 'Cidade / endereço, ex.: Blumenau, SC (deixe vazio para não mostrar)', kind: 'i' },
      { key: 'socInstagram', label: 'Link do Instagram', kind: 'i' },
      { key: 'socYoutube', label: 'Link do YouTube', kind: 'i' },
      { key: 'socSpotify', label: 'Link do Spotify', kind: 'i' },
      { key: 'socSoundcloud', label: 'Link do SoundCloud', kind: 'i' },
    ],
  },
  rodape: {
    title: 'Rodapé',
    resources: [],
    texts: [{ key: 'footer', label: 'Texto do rodapé', kind: 'i' }],
  },
};

/** Campos de endereço entre os textos do site (validados como https). */
export const URL_TEXT_KEYS = new Set(['socInstagram', 'socYoutube', 'socSpotify', 'socSoundcloud']);
