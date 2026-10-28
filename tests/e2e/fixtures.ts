import type { Page } from '@playwright/test';

const SUPA = 'https://btzeamyzvltiuslquwhm.supabase.co';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

const texts = Object.entries({
  heroKicker: 'Cortina aberta desde 2005', heroLine1: 'Teatro', heroLine2: 'de Blumenau', heroText: 'O movimento de grupos.', heroBtn1: 'Ver a programação', heroBtn2: 'Ler nossa história',
  bubbleNum: '20', bubbleLabel: 'anos', sobreKicker: 'Sobre', sobreTitle: 'Um palco coletivo.', sobreP1: 'Texto 1', sobreP2: 'Texto 2',
  agendaKicker: 'Agenda', agendaTitle: 'Em cartaz', agendaText: 'Entrada em chapéu consciente.', historiaKicker: 'História & notícias', historiaTitle: 'Vinte anos em cena',
  midiasKicker: 'Mídias', midiasTitle: 'Assista & ouça', videosTitle: 'Leituras', podcastsTitle: 'Podcasts', fotosTitle: 'Fotos', elencoKicker: 'Integrantes', elencoTitle: 'O elenco do movimento',
  contatoKicker: 'Contato', contatoTitle: 'Entre em cena', contatoText: 'Escreva para a gente.', footer: '© 2025 Movimento TBT',
  stat1v: '2005', stat1l: 'ano', stat2v: '20', stat2l: 'anos', stat3v: '8', stat3l: 'integrantes', stat4v: '1x/mês', stat4l: 'conversa',
  socInstagram: 'https://instagram.com/x', socYoutube: 'https://youtube.com/x', socSpotify: 'https://spotify.com/x', socSoundcloud: 'https://soundcloud.com/x',
}).map(([key, value]) => ({ key, value }));

const show = (i: number, title: string, date: string) => ({ id: `s${i}`, title, group_name: 'Grupo', date, time: '20:00:00', place: 'Teatro', price: 'Chapéu consciente', image_url: null, description: 'Descrição', published: true });

function hp(id: string, slug: string, title: string, event_date: string) {
  return { id, slug, title, event_date, date_precision: 'day', date_label: null, group_name: 'Grupo', city: 'Blumenau/SC', venue: null, body: `Texto de ${title}.

Sinopse de ${title}.`, cover_url: null, photos: [], published: true };
}

/** Aplica os filtros simples do PostgREST usados pelo site (eq, gte, lte). */
function applyFilters(rows: unknown[], params: URLSearchParams): unknown[] {
  return rows.filter((row) => {
    const r = row as Record<string, unknown>;
    for (const [k, v] of params) {
      const m = v.match(/^(eq|gte|lte)\.(.*)$/);
      if (!m || !(k in r)) continue;
      const val = String(r[k]);
      if (m[1] === 'eq' && val !== m[2]) return false;
      if (m[1] === 'gte' && val < (m[2] ?? '')) return false;
      if (m[1] === 'lte' && val > (m[2] ?? '')) return false;
    }
    return true;
  });
}

export const tables: Record<string, unknown[]> = {
  site_content: texts,
  shows: [show(1, 'Espetáculo Um', '2099-01-10'), show(2, 'Espetáculo Dois', '2099-02-10')],
  posts: [
    { id: 'p1', title: 'Notícia de teste', category: 'Notícia', date: '2025-06-10', image_url: null, excerpt: 'Resumo', published: true },
    { id: 'p2', title: 'Notícia antiga', category: 'Notícia', date: '2024-02-21', image_url: null, excerpt: 'Resumo', published: true },
  ],
  history_years: [
    { year: 2005, postagens: 1, filipetas: 0, clipagens: 1 },
    { year: 2006, postagens: 2, filipetas: 1, clipagens: 0 },
  ],
  history_posts: [
    hp('h1', 'o-sonho-2005', 'O Sonho', '2005-03-20'),
    hp('h2', 'sujos-2006', 'Sujos', '2006-03-08'),
    hp('h3', 'a-caixa-2006', 'A Caixa', '2006-10-10'),
  ],
  history_flyers: [{ id: 'fl1', event_date: '2006-01-01', date_precision: 'year', image_url: '/images/acervo/foto-reuniao-movimento.webp', caption: 'Filipeta 1', position: 0 }],
  history_clippings: [{ id: 'cl1', event_date: '2005-03-17', date_precision: 'day', image_url: '/images/acervo/foto-reuniao-movimento.webp', newspaper: 'Jornal de Santa Catarina', caption: 'Recorte 1', position: 0 }],
  history_intros: [{ year: 2006, kind: 'filipetas', body: 'Texto das filipetas de 2006.' }],
  members: [1, 2, 3].map((i) => ({ id: `m${i}`, position: i, name: `Integrante ${i}`, role: 'Atriz', bio: 'Bio', photo_url: null, link_url: null, link_label: null })),
  videos: [{ id: 'v1', position: 0, title: 'Vídeo 1', who: 'Grupo', href: 'https://youtube.com/watch?v=1' }],
  podcasts: [{ id: 'c1', position: 0, n: '01', title: 'Podcast 1', href: 'https://spotify.com/1' }],
  photos: [{ id: 'f1', position: 0, caption: 'Foto 1', taken_when: '2019', src: '/images/acervo/foto-reuniao-movimento.webp' }],
};

export interface Captured { contactPosts: unknown[] }

/** Intercepta o Supabase: nenhum teste toca o banco real. */
export async function mockSupabase(page: Page, opts: { contactStatus?: number } = {}): Promise<Captured> {
  const captured: Captured = { contactPosts: [] };
  await page.route(`${SUPA}/rest/v1/**`, async (route) => {
    const req = route.request();
    const table = new URL(req.url()).pathname.split('/').pop() ?? '';
    if (req.method() === 'POST' && table === 'contact_messages') {
      captured.contactPosts.push(req.postDataJSON());
      return route.fulfill(opts.contactStatus && opts.contactStatus >= 400
        ? { status: opts.contactStatus, contentType: 'application/json', body: JSON.stringify({ code: 'P0001', message: 'Muitas mensagens. Tente mais tarde.' }) }
        : { status: 201, body: '' });
    }
    if (req.method() === 'GET') {
      const rows = applyFilters(tables[table] ?? [], new URL(req.url()).searchParams);
      const single = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
      return route.fulfill(json(single ? rows[0] ?? null : rows));
    }
    return route.fulfill({ status: 204, body: '' });
  });
  return captured;
}
