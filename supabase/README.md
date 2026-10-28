# Banco de dados (Supabase) — Movimento TBT

Projeto Supabase: **movimento tbt** (`btzeamyzvltiuslquwhm`, região sa-east-1).
O banco **já está criado e configurado**. Migrações aplicadas (nesta ordem): `schema_base_seguro`, `seed_conteudo_site04`, `endurecer_funcoes_e_politicas`.
Para obter o SQL completo: `supabase db dump --schema public` (CLI do Supabase).

## Tabelas
| Tabela | Leitura pública | Escrita |
|---|---|---|
| site_content (textos) | sim | só admin |
| shows, posts | só `published = true` | só admin (admin também lê os ocultos) |
| members, videos, podcasts, photos | sim | só admin |
| contact_messages | **não** | público só INSERT (limite por tempo); ler/atualizar/excluir só admin |
| admins, audit_log | **não** | admins só via Edge Function / triggers; leitura só admin |

## Camadas de segurança no banco
- RLS ativo em todas as tabelas; políticas `is_admin()` (função SECURITY DEFINER, sem execução para `anon`).
- Restrições CHECK: tamanhos máximos, links apenas `https://`, assuntos de contato permitidos.
- Limite de envios do formulário de contato no próprio banco (anti-spam).
- Trilha de auditoria (`audit_log`) por gatilhos nas tabelas editáveis.
- Storage `site-images`: leitura pública, envio/alteração/exclusão só admin.
- Edge Function `admin-users` (`functions/admin-users/index.ts`): `verify_jwt` + confere se quem chama é admin + CORS restrito + senha ≥ 12 caracteres.

## Criar o primeiro administrador
1. Supabase → **Authentication → Users → Add user → Create new user** (e-mail + senha forte, marque *Auto Confirm User*).
2. No **SQL Editor**, rode (trocando o e-mail):
```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'SEU_EMAIL_AQUI';
```
3. Outros administradores: depois de entrar, use **/admin/administradores** no site.

## Ajustes manuais no painel (a API não permite fazer por aqui)
Authentication → Sign In / Providers → desligue **Allow new users to sign up**.
Authentication → Passwords → mínimo 12, exigir maiúsculas/minúsculas/números, ative **Leaked password protection** (plano Pro) .
Authentication → Rate Limits → mantenha os padrões ou reduza.
Edge Functions → `admin-users` → Secrets: `ALLOWED_ORIGINS` = `https://movimentotbt.art,https://www.movimentotbt.art,https://mov-tbt.vercel.app`.

## Recuperação de senha (e-mail personalizado)
O site tem "Esqueci minha senha" em `/login` → `/recuperar-senha`, e o link do e-mail abre `/redefinir-senha`.
Camadas de segurança: resposta igual exista ou não o e-mail; espera de 60 s entre pedidos (mais o limite do próprio Supabase);
link de uso único que expira; senha forte (mín. 12, maiúsculas, minúsculas e números); após a troca, **todas as sessões são encerradas**;
o código do link é apagado da barra de endereço; páginas com `noindex` e bloqueadas no `robots.txt`.

Ajustes no painel (uma vez só):

1. **Endereços permitidos** — Authentication → URL Configuration
   - Site URL: `https://movimentotbt.art`
   - Redirect URLs: `http://localhost:*/redefinir-senha` (qualquer porta local: 5173 do `npm run dev`, 3000 do `vercel dev`),
     `https://movimentotbt.art/redefinir-senha`, `https://www.movimentotbt.art/redefinir-senha` e `https://mov-tbt.vercel.app/redefinir-senha`.
   Sem isso o Supabase ignora o endereço pedido e manda o link para o Site URL (enquanto o domínio ainda estiver na Wix, dá 404).
2. **Remetente próprio via Brevo** — na Brevo: *SMTP & API → SMTP → Gerar nova chave SMTP* (copie a chave; ela só aparece uma vez).
   No Supabase: Authentication → Emails → **SMTP Settings** → *Enable custom SMTP*:
   - Sender email: `fernandoacacioschatz@gmail.com` (remetente já verificado na Brevo; troque por `contato@movimentotbt.art` depois de autenticar o domínio na Brevo)
   - Sender name: `Movimento TBT`
   - Host: `smtp-relay.brevo.com` · Port: `587`
   - Username: o login SMTP mostrado na Brevo (ex.: `…@smtp-brevo.com`)
   - Password: a chave SMTP gerada (nunca coloque essa chave no código nem no `.env`).
3. **Modelo do e-mail** — Authentication → Emails → Templates → **Reset Password**:
   - Subject: `Redefinir sua senha — Movimento TBT`
   - Body: cole o conteúdo de [`templates/recuperar-senha.html`](templates/recuperar-senha.html).
   O logo do e-mail vem de `https://mov-tbt.vercel.app/images/email/logo-tbt.png` (troque para `movimentotbt.art` depois da troca do DNS).
4. **Senhas** — Authentication → Providers → Email: *Minimum password length* = 12 e *Password requirements* = letras maiúsculas, minúsculas e números.
5. Confirme também *Allow new users to sign up* **desligado** (só administradores criam contas, pelo site).
