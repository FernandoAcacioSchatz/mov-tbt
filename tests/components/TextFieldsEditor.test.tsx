import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextFieldsEditor } from '../../src/admin/TextFieldsEditor';
import { ContentProvider } from '../../src/hooks/useContent';
import type { SiteContent } from '../../src/types/content';

const content: SiteContent = { texts: { sobreP1: 'Olá' }, shows: [], members: [], videos: [], podcasts: [], photos: [] };

function setup() {
  return render(
    <ContentProvider initial={content}>
      <TextFieldsEditor fields={[{ key: 'sobreP1', label: 'Parágrafo 1', kind: 'A' }]} onMessage={vi.fn()} />
    </ContentProvider>,
  );
}

describe('TextFieldsEditor', () => {
  it('conta os caracteres a cada letra digitada', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByText('3 / 5.000 caracteres')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Parágrafo 1'), '!');
    expect(screen.getByText('4 / 5.000 caracteres')).toBeInTheDocument();
  });
  it('avisa quando passa do limite', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Parágrafo 1'), { target: { value: 'a'.repeat(5002) } });
    expect(screen.getByText('5.002 / 5.000 caracteres — 2 acima do limite')).toHaveClass('field__count--over');
  });
});
