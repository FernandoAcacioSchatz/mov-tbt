// Gestão de administradores do Movimento TBT.
// Somente administradores autenticados podem listar, cadastrar e remover admins.
// A chave de serviço fica apenas aqui (servidor) e nunca chega ao navegador.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Origens permitidas (CORS). Acrescente o domínio do site em produção via secret ALLOWED_ORIGINS.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://movimentotbt.art,https://www.movimentotbt.art,https://mov-tbt.vercel.app")
  .split(",").map((s) => s.trim()).filter(Boolean);
// Desenvolvimento: qualquer porta local (o Vite troca de porta quando a 5173 está ocupada).
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/;

function isAllowed(origin: string | null): origin is string {
  return !!origin && (ALLOWED_ORIGINS.includes(origin) || LOCAL_ORIGIN.test(origin));
}

function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = {
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store",
  };
  if (isAllowed(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function passwordProblem(p: string): string | null {
  if (p.length < 12) return "A senha precisa ter pelo menos 12 caracteres.";
  if (p.length > 128) return "A senha é longa demais.";
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
    return "Use letras maiúsculas, minúsculas e números na senha.";
  }
  return null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405, origin);
  if (origin && !isAllowed(origin)) return json({ error: "Origem não permitida." }, 403, origin);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Não autenticado." }, 401, origin);

  // 1) Quem está chamando?
  const caller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await caller.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Sessão inválida." }, 401, origin);
  const me = userData.user;

  // 2) É administrador? (consulta com chave de serviço, no servidor)
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: isAdminRow } = await admin.from("admins").select("user_id").eq("user_id", me.id).maybeSingle();
  if (!isAdminRow) return json({ error: "Acesso negado." }, 403, origin);

  // 3) Entrada validada
  const raw = await req.text();
  if (raw.length > 2000) return json({ error: "Requisição grande demais." }, 413, origin);
  let body: { action?: string; email?: string; password?: string; user_id?: string };
  try { body = JSON.parse(raw); } catch { return json({ error: "JSON inválido." }, 400, origin); }

  if (body.action === "list") {
    const { data, error } = await admin.from("admins").select("user_id,email,created_at").order("created_at");
    if (error) return json({ error: "Não foi possível listar." }, 500, origin);
    return json({ admins: data }, 200, origin);
  }

  if (body.action === "create") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: "E-mail inválido." }, 400, origin);
    const pw = passwordProblem(password);
    if (pw) return json({ error: pw }, 400, origin);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (createErr || !created.user) {
      const msg = /already|registered|exists/i.test(createErr?.message ?? "") ? "Este e-mail já está cadastrado." : "Não foi possível criar o usuário.";
      return json({ error: msg }, 400, origin);
    }
    const { error: insErr } = await admin.from("admins").insert({ user_id: created.user.id, email, created_by: me.id });
    if (insErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: "Não foi possível cadastrar o administrador." }, 500, origin);
    }
    return json({ ok: true, user_id: created.user.id, email }, 200, origin);
  }

  if (body.action === "remove") {
    const target = String(body.user_id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(target)) return json({ error: "Identificador inválido." }, 400, origin);
    if (target === me.id) return json({ error: "Você não pode remover a si mesmo." }, 400, origin);
    const { count } = await admin.from("admins").select("user_id", { count: "exact", head: true });
    if ((count ?? 0) <= 1) return json({ error: "É preciso manter pelo menos um administrador." }, 400, origin);
    const { error: delErr } = await admin.from("admins").delete().eq("user_id", target);
    if (delErr) return json({ error: "Não foi possível remover." }, 500, origin);
    await admin.auth.admin.deleteUser(target);
    return json({ ok: true }, 200, origin);
  }

  return json({ error: "Ação desconhecida." }, 400, origin);
});
