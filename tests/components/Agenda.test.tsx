import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Agenda } from '../../src/sections/Agenda';
import { ContentProvider } from '../../src/hooks/useContent';
import type { Show, SiteContent } from '../../src/types/content';

const show = (id: string, title: string, date: string, published = true): Show => ({ id, title, group_name: 'Grupo', date, time: '20:00', place: 'Teatro', price: 'Chapéu', image_url: null, description: 'desc', published });
const content: SiteContent = {
  texts: { agendaKicker: 'Agenda', agendaTitle: 'Em cartaz', agendaText: 'texto' },
  shows: [show('1', 'Primeira', '2099-01-01'), show('2', 'Segunda', '2099-02-01'), show('3', 'Oculta', '2099-03-01', false)],
  members: [], videos: [], podcasts: [], photos: [],
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as unknown as typeof window.matchMedia;
});
afterEach(() => vi.useRealTimers());

describe('Agenda (carrossel)', () => {
  it('mostra só espetáculos publicados', () => {
    render(<ContentProvider initial={content}><Agenda /></ContentProvider>);
    expect(screen.getByText('Primeira')).toBeInTheDocument();
    expect(screen.getByText('Segunda')).toBeInTheDocument();
    expect(screen.queryByText('Oculta')).not.toBeInTheDocument();
  });

  it('avança sozinho e pode ser pausado', async () => {
    render(<ContentProvider initial={content}><Agenda /></ContentProvider>);
    const dots = () => screen.getAllByRole('button', { name: /Ir para o espetáculo/ });
    expect(dots()[0]).toHaveAttribute('aria-current', 'true');
    act(() => { vi.advanceTimersByTime(6100); });
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole('button', { name: 'Pausar rotação automática' }));
    act(() => { vi.advanceTimersByTime(13000); });
    expect(dots()[1]).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Retomar rotação automática' })).toBeInTheDocument();
  });

  it('setas navegam', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ContentProvider initial={content}><Agenda /></ContentProvider>);
    await user.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getAllByRole('button', { name: /Ir para o espetáculo/ })[1]).toHaveAttribute('aria-current', 'true');
    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(screen.getAllByRole('button', { name: /Ir para o espetáculo/ })[0]).toHaveAttribute('aria-current', 'true');
  });
});
