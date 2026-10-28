import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Header } from '../../src/components/layout/Header';
import { ContentProvider } from '../../src/hooks/useContent';
import type { SiteContent } from '../../src/types/content';

const content = (texts: Record<string, string> = {}): SiteContent => ({ texts, shows: [], members: [], videos: [], podcasts: [], photos: [] });

function setup(texts?: Record<string, string>) {
  return render(<MemoryRouter><ContentProvider initial={content(texts)}><Header /></ContentProvider></MemoryRouter>);
}

describe('Header', () => {
  it('lista as seções na ordem combinada', () => {
    setup();
    const names = screen.getAllByRole('link').map((l) => l.textContent).filter((t) => t && !t.includes('agenda'));
    expect(names).toEqual(['Agenda', 'Sobre', 'História', 'Mídias', 'Integrantes', 'Contato']);
  });
  it('abre e fecha o menu no celular', async () => {
    const user = userEvent.setup();
    setup();
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveAttribute('aria-expanded', 'true');
  });
  it('usa a logo trocada pelo admin e ignora endereços inseguros', () => {
    const { unmount } = setup({ logoTopo: 'https://exemplo.supabase.co/logo.png' });
    expect(screen.getByAltText(/Logo Movimento/)).toHaveAttribute('src', 'https://exemplo.supabase.co/logo.png');
    unmount();
    setup({ logoTopo: 'javascript:alert(1)' });
    expect(screen.getByAltText(/Logo Movimento/)).toHaveAttribute('src', '/images/mascaras-84.webp');
  });
});
