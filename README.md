# Movimento TBT — site oficial

Site do **Movimento Temporada Blumenauense de Teatro** (React + TypeScript + Vite) com painel de edição integrado e backend no Supabase.

## Requisitos
- Node.js 20+ e npm
- Conta no Supabase (já existe o projeto "movimento tbt")

## Instalação e uso local
```bash
npm install
cp .env.example .env     # preencha as 2 variáveis do Supabase (veja abaixo)
npm run dev              # http://localhost:5173
```
Variáveis (`.env`): `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (chave **pública** — pode ficar no front; **nunca** coloque a `service_role` aqui). Opcional: `VITE_SITE_URL`.

## Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | verifica tipos e gera `dist/` |
| `npm run preview` | serve o `dist/` com os mesmos cabeçalhos de segurança de produção |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npm test` | testes unitários e de componentes (Vitest + Testing Library) |
| `npm run test:e2e` | testes de ponta a ponta (Playwright, banco simulado) |
| `npm run check` | tipos + lint + testes + build |
| `npm run audit:deps` | auditoria de vulnerabilidades das dependências |

Playwright: se o navegador não estiver instalado, rode `npx playwright install chromium` ou aponte `PW_CHROMIUM_PATH=/caminho/do/chromium`.

## Como o site funciona
- **Público:** `/` (todas as seções) e `/privacidade`.
- **Edição:** `/login` → `/admin` mostra o mesmo site com botão **✎ Editar** em cada seção. O painel abre acima da seção: textos, e CRUD de espetáculos, posts, integrantes, vídeos, podcasts e fotos (↑↓ para ordenar; envio de imagem para o Storage).
- **/admin/mensagens:** caixa de entrada do formulário de contato (aviso por e-mail/WhatsApp ficou para uma próxima etapa).
- **/admin/administradores:** cadastrar/remover outros administradores (e-mail + senha).

## Estrutura
```
src/
  app/          rotas (App, RequireAdmin, NoIndex)
  components/   ui/ (botões, carrossel, links seguros) e layout/ (Header, Footer)
  sections/     Hero, TickerBand, About, Agenda, Stories, Media, Cast, Contact
  pages/        Home, Privacy, Login, AdminMessages, AdminUsers, NotFound
  admin/        painel: config das seções, editores de texto e de listas, upload
  hooks/        useContent, useAuth, useEditMode, useScrollCarousel, useTexts
  services/     toda a comunicação com o Supabase (nenhuma chamada solta nos componentes)
  schemas/      validações Zod (contato, login, administradores, recursos)
  styles/       variables.css (design tokens), globals.css, site.css, admin.css
  types/ utils/ test/
supabase/       README do banco + Edge Function admin-users
tests/          components/ (Vitest) e e2e/ (Playwright)
```

## Segurança (resumo)
Banco com RLS em tudo; só administradores escrevem; visitantes só leem conteúdo publicado e só **inserem** mensagens de contato (com limite no banco, campo-armadilha anti-robô, validação Zod e consentimento LGPD). Links vindos do banco passam por `safeUrl` (bloqueia `javascript:`/`data:`); nenhum `dangerouslySetInnerHTML` (regra de lint). CSP restritiva, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer/Permissions-Policy em `vercel.json` e `public/_headers`. `/admin` e `/login` com `noindex` e bloqueados no `robots.txt`. Login com mensagem genérica e pausa após 5 erros. Upload só JPG/PNG/WebP/GIF até 5 MB, com nome gerado. Detalhes do banco em `supabase/README.md`.

## Publicar (deploy manual)
1. `npm run build` (gera `dist/`).
2. **Vercel** (recomendado): importe a pasta como projeto Vite, defina as 2 variáveis de ambiente `VITE_*`, e faça o deploy. `vercel.json` já traz rotas SPA e cabeçalhos. **Netlify:** `public/_headers` e `public/_redirects` já fazem o mesmo.
3. Domínio: aponte `movimentotbt.art` (DNS) para a hospedagem e confirme o HTTPS. **Só troque o DNS quando aprovar o site novo** — o site atual no Wix continua no ar até lá.
4. No Supabase, defina o secret `ALLOWED_ORIGINS` com o domínio final e faça os ajustes manuais descritos em `supabase/README.md`.
5. Se mudar o endereço do Supabase, atualize `connect-src` na CSP (`vercel.json` e `public/_headers`).

## História (linha do tempo por ano)
- **Site:** `/historia` mostra os anos que têm conteúdo. Ao abrir um ano (`/historia/2006`), aparecem até três portas, cada uma com a sua lista: **Postagens** (espetáculos e acontecimentos, cada um com página própria e "anterior/próxima"), **Filipetas** e **Clipagens** (galerias que ampliam ao tocar).
- **Ordem:** sempre cronológica, pela **data do acontecimento** (nunca pela data em que foi cadastrado). Não existe ordenação manual. Itens com a mesma data seguem uma ordem fixa.
- **Painel:** `/admin/historia`. Escolha o ano e o tipo e use **+ Nova postagem**, **+ Nova filipeta** ou **+ Nova clipagem**; cada um tem o seu formulário. A data pode ser dia exato, só mês ou só ano. Filipetas e clipagens também têm um texto de abertura por ano.
- **Regras de data** (no formulário e no banco, conferidas ao cadastrar e quando a data muda; "hoje" = horário de Brasília):
  - História: de 01/01/2004 até hoje.
  - Agenda (próximas apresentações): de hoje em diante.
- **Banco:** tabelas `history_posts`, `history_flyers`, `history_clippings`, `history_intros` e a visão `history_years`. A tabela `posts` guarda só **notícias**.
- **Acervo migrado do Wix:** 98 postagens (2005–2014 e 2021), 57 filipetas e 15 clipagens, com textos completos copiados para o banco e imagens tiradas da pasta `image/`, otimizadas em `public/images/historia/<ano>/<tipo>/` (cada uma com miniatura `-480.webp`).

## Imagens
- Todas as imagens do site ficam no próprio projeto: `public/images/` (logo e hero) e `public/images/acervo/` (fotos de espetáculos, posts, integrantes e galeria, em WebP otimizado). Nada depende mais do Wix.
- No banco, esses campos guardam o caminho local (ex.: `/images/acervo/foto-reuniao-movimento.webp`). Imagens novas enviadas pelo painel vão para o Storage do Supabase (`site-images`).
- A pasta `image/` na raiz é o acervo bruto exportado do Wix (655 MB). Não é publicada e está no `.gitignore`. Para usar outra foto dela no site, otimize-a (WebP, até ~1600px) e coloque em `public/images/acervo/`, ou envie pelo painel.

## Pendências conhecidas
- Aviso de novas mensagens por e-mail/WhatsApp (planejado).
- Política de Privacidade é um **modelo** a revisar juridicamente.
- A agenda real só tem 1 evento (junho/2025, já passado).
