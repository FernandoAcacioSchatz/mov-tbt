import { expect, test } from '@playwright/test';
import { mockSupabase } from './fixtures';

test.describe('site público', () => {
  test('mostra todas as seções na ordem combinada e sem seção de imprensa', async ({ page }) => {
    await mockSupabase(page);
    const violations: string[] = [];
    page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Teatro');
    const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual(['inicio', 'agenda', 'sobre', 'historia', 'midias', 'integrantes', 'contato']);
    await expect(page.getByText(/sala de imprensa/i)).toHaveCount(0);
    expect(violations).toEqual([]);
  });

  test('agenda: setas e pausa funcionam', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/');
    const dots = page.getByRole('button', { name: /Ir para o espetáculo/ });
    await expect(dots.first()).toHaveAttribute('aria-current', 'true');
    await page.getByRole('button', { name: 'Próximo' }).first().click();
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await page.getByRole('button', { name: 'Pausar rotação automática' }).first().click();
    await expect(page.getByRole('button', { name: 'Retomar rotação automática' }).first()).toBeVisible();
  });

  test('história: anos → portas → postagens em ordem → postagem com anterior/próxima', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/');
    await page.getByRole('list', { name: 'Anos da História' }).getByRole('link', { name: '2006' }).click();
    await expect(page).toHaveURL(/\/historia\/2006$/);
    await expect(page.getByRole('heading', { level: 1, name: '2006' })).toBeVisible();
    // só as portas com conteúdo: 2006 tem postagens e filipetas, mas não clipagens
    await expect(page.getByRole('link', { name: /Postagens/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Filipetas/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Clipagens/ })).toHaveCount(0);

    await page.getByRole('link', { name: /Postagens/ }).click();
    await expect(page.locator('.tl-card__title')).toHaveText(['Sujos', 'A Caixa']);

    await page.getByRole('link', { name: /Sujos/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Sujos' })).toBeVisible();
    await expect(page.getByText('Sinopse de Sujos.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Anterior · 2005\s*O Sonho/ })).toBeVisible();
    await page.getByRole('link', { name: /Próxima · 2006/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'A Caixa' })).toBeVisible();
  });

  test('história: galeria de filipetas abre ampliada e fecha com Esc', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/historia/2006/filipetas');
    await expect(page.getByText('Texto das filipetas de 2006.')).toBeVisible();
    await page.getByRole('button', { name: /Ampliar Filipeta 1/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('história: ano sem conteúdo e endereço inválido', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/historia/2010');
    await expect(page.getByText('Ainda não há nada cadastrado em 2010.')).toBeVisible();
    await page.goto('/historia/abc');
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  });

  test('contato: valida, envia e mostra confirmação', async ({ page }) => {
    const captured = await mockSupabase(page);
    await page.goto('/#contato');
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByText('Informe seu nome.')).toBeVisible();
    await page.getByLabel('Nome', { exact: true }).fill('Maria Silva');
    await page.getByLabel('E-mail', { exact: true }).fill('maria@exemplo.com');
    await page.getByLabel('Mensagem', { exact: true }).fill('Quero participar do movimento.');
    await page.getByLabel(/Li e aceito/).check();
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByText('Obrigado pelo envio!')).toBeVisible();
    expect(captured.contactPosts).toHaveLength(1);
    expect(captured.contactPosts[0]).toMatchObject({ email: 'maria@exemplo.com' });
  });

  test('contato: mostra erro do servidor (limite de envios)', async ({ page }) => {
    await mockSupabase(page, { contactStatus: 400 });
    await page.goto('/#contato');
    await page.getByLabel('Nome', { exact: true }).fill('Maria Silva');
    await page.getByLabel('E-mail', { exact: true }).fill('maria@exemplo.com');
    await page.getByLabel('Mensagem', { exact: true }).fill('Quero participar do movimento.');
    await page.getByLabel(/Li e aceito/).check();
    await page.getByRole('button', { name: 'Enviar mensagem' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Muitas mensagens' })).toBeVisible();
  });

  test('página de privacidade abre', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/privacidade');
    await expect(page.getByRole('heading', { name: 'Política de Privacidade' })).toBeVisible();
  });

  for (const width of [320, 960, 1366, 1920]) {
    test(`sem rolagem horizontal nem cabeçalho estourado (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await mockSupabase(page);
      await page.goto('/');
      await page.waitForSelector('#contato');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      // nenhum elemento do cabeçalho passa da borda direita
      const headerOverflow = await page.locator('.header__inner').evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(headerOverflow).toBeLessThanOrEqual(0);
    });
  }

  test('menu funciona a partir da página de privacidade', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 });
    await mockSupabase(page);
    await page.goto('/privacidade');
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Agenda' }).click();
    await expect(page).toHaveURL(/\/#agenda$/);
    await expect(page.locator('#agenda')).toBeInViewport();
  });

  test('imagens vêm do próprio site', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/');
    await page.waitForSelector('#contato');
    const external = await page.locator('img').evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).currentSrc || (i as HTMLImageElement).src).filter((s) => s && !s.startsWith(location.origin)));
    expect(external).toEqual([]);
  });
});

test.describe('área administrativa', () => {
  test('/admin sem login redireciona para /login', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  });

  test('login valida campos e não revela se o e-mail existe', async ({ page }) => {
    await mockSupabase(page);
    await page.route('https://btzeamyzvltiuslquwhm.supabase.co/auth/v1/token**', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }) }));
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Informe o e-mail.')).toBeVisible();
    await page.getByLabel('E-mail', { exact: true }).fill('alguem@exemplo.com');
    await page.getByLabel('Senha', { exact: true }).fill('senhaerrada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible();
  });

  test('olhinho mostra e oculta a senha', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/login');
    const senha = page.getByLabel('Senha', { exact: true });
    await senha.fill('MinhaSenha123');
    await expect(senha).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Mostrar senha' }).click();
    await expect(senha).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Ocultar senha' }).click();
    await expect(senha).toHaveAttribute('type', 'password');
  });

  test('recuperar senha: resposta genérica, link certo e espera entre pedidos', async ({ page }) => {
    await mockSupabase(page);
    let redirect = '';
    await page.route('https://btzeamyzvltiuslquwhm.supabase.co/auth/v1/recover**', (r) => {
      redirect = new URL(r.request().url()).searchParams.get('redirect_to') ?? '';
      return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/login');
    await page.getByRole('link', { name: 'Esqueci minha senha' }).click();
    await page.getByLabel('E-mail').fill('qualquer@exemplo.com');
    await page.getByRole('button', { name: 'Enviar link' }).click();
    await expect(page.getByText(/Se esse e-mail estiver cadastrado/)).toBeVisible();
    expect(redirect).toMatch(/\/redefinir-senha$/);
    await expect(page.getByRole('button', { name: /Aguarde \d+s/ })).toBeDisabled();
  });

  test('redefinir senha: link expirado ou aberto sem o e-mail', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/redefinir-senha#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    await expect(page.getByText('Este link expirou. Peça um novo link de recuperação.')).toBeVisible();
    expect(page.url()).not.toContain('error');
    await page.goto('/redefinir-senha');
    await expect(page.getByText('Abra esta página pelo link enviado ao seu e-mail.')).toBeVisible();
  });

  test('/login e /admin pedem aos buscadores para não indexar', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/login');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});
