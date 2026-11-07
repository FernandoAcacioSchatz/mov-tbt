# Migrations — esquema e políticas RLS versionados (F-05)

Toda a segurança de leitura/escrita dos dados vive nas **políticas RLS** e na função
`is_admin()` do Supabase. Antes isso só existia no banco; agora o SQL real está **versionado
aqui**, exportado do projeto `btzeamyzvltiuslquwhm` em 06/11/2026, e portanto auditável em
revisão de código.

## Arquivos (ordem de aplicação)

| Versão | Arquivo | O que faz |
|---|---|---|
| 20261020131049 | `…_schema_base_seguro.sql` | Tabelas, **RLS em tudo**, policies, `is_admin()`, triggers de auditoria, rate limit de contato, bucket `site-images`. |
| 20261020131136 | `…_seed_conteudo_site04.sql` | Conteúdo inicial do site (textos, espetáculos, elenco, mídias). |
| 20261020131204 | `…_endurecer_funcoes_e_politicas.sql` | Revoga `execute` de funções internas; restringe `is_admin()` a `authenticated`. |
| 20261020135647 | `…_permitir_imagens_locais.sql` | Aceita imagens `/images/...` do próprio site, sem `..`. |
| 20261020161418 | `…_historia_estrutura.sql` | Tabelas da História (posts/flyers/clippings/intros) + RLS + regras de data. |
| 20261020173356 | `…_history_years_capa.sql` | View `history_years` com capa por ano. |
| 20261020181349 | `…_videos_capa.sql` | Coluna `cover_url` em `videos`. |
| 20261020200913 | `…_members_bio_limit_2000.sql` | Amplia limite da bio para 2000. |
| 20261029163037 | `…_historia_na_midia.sql` | Tabela `history_media` + RLS; atualiza a view. |

Estes arquivos correspondem às versões já aplicadas (registradas em
`supabase_migrations.schema_migrations`), então um `supabase db push` **não os reaplica** —
eles servem de registro auditável e base para mudanças futuras.

## Manter em sincronia daqui pra frente

```bash
supabase login
supabase link --project-ref btzeamyzvltiuslquwhm
supabase db pull        # traz mudanças feitas no painel para novos arquivos aqui
supabase db diff -f minha_mudanca   # cria migration a partir de alterações locais
```

## Verificação de segurança periódica (Advisors)

Rodar e resolver o que aparecer em Supabase → **Advisors → Security/Performance**.
Estado em 06/11/2026 (via MCP):
- `auth_leaked_password_protection` = **WARN** → ver F-06 (ativar no painel).
- `is_admin()` SECURITY DEFINER executável por `authenticated` = **WARN**, porém
  **intencional**: o app chama `rpc('is_admin')` para saber se o usuário logado é admin, e a
  função só revela o status do próprio chamador. Pode ser mantido.
