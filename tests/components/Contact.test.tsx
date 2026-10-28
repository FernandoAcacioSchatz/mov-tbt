import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Contact } from '../../src/sections/Contact';
import { ContentProvider } from '../../src/hooks/useContent';
import type { SiteContent } from '../../src/types/content';

const insert = vi.fn();
vi.mock('../../src/services/supabaseClient', () => ({ supabase: { from: () => ({ insert: (row: unknown) => insert(row) }) } }));

const content: SiteContent = { texts: { contatoKicker: 'Contato', contatoTitle: 'Entre em cena', contatoText: 'Escreva' }, shows: [], members: [], videos: [], podcasts: [], photos: [] };

function setup() {
  return render(<MemoryRouter><ContentProvider initial={content}><Contact /></ContentProvider></MemoryRouter>);
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome'), 'Maria Silva');
  await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
  await user.type(screen.getByLabelText('Mensagem'), 'Gostaria de participar do movimento.');
}

describe('Contact', () => {
  beforeEach(() => insert.mockReset());

  it('mostra erros de validação e não envia', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(await screen.findByText('Informe seu nome.')).toBeInTheDocument();
    expect(screen.getByText('É necessário aceitar a Política de Privacidade.')).toBeInTheDocument();
    expect(insert).not.toHaveBeenCalled();
  });

  it('envia e mostra confirmação', async () => {
    insert.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    setup();
    await fillValid(user);
    await user.click(screen.getByLabelText(/Li e aceito/));
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(await screen.findByText('Obrigado pelo envio!')).toBeInTheDocument();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ email: 'maria@exemplo.com', subject: 'Quero entrar em contato' }));
  });

  it('mostra erro amigável quando o servidor falha e mantém os dados', async () => {
    insert.mockResolvedValue({ error: { code: 'P0001', message: 'Muitas mensagens. Tente mais tarde.' } });
    const user = userEvent.setup();
    setup();
    await fillValid(user);
    await user.click(screen.getByLabelText(/Li e aceito/));
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Muitas mensagens');
    expect(screen.getByLabelText('Nome')).toHaveValue('Maria Silva');
  });

  it('robô que preenche a armadilha não envia nada', async () => {
    const user = userEvent.setup();
    setup();
    await fillValid(user);
    await user.type(document.getElementById('f-site') as HTMLInputElement, 'spam');
    await user.click(screen.getByLabelText(/Li e aceito/));
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    expect(await screen.findByText('Obrigado pelo envio!')).toBeInTheDocument();
    await waitFor(() => expect(insert).not.toHaveBeenCalled());
  });
});
