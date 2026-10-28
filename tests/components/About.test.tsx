import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { About } from '../../src/sections/About';
import { ContentProvider } from '../../src/hooks/useContent';
import type { SiteContent } from '../../src/types/content';

const setup = (texts: Record<string, string>) => {
  const content: SiteContent = { texts, shows: [], members: [], videos: [], podcasts: [], photos: [] };
  return render(<ContentProvider initial={content}><About /></ContentProvider>);
};

describe('About', () => {
  it('esconde os destaques deixados em branco', () => {
    const { container } = setup({ stat1v: '20', stat1l: 'anos', stat2v: '', stat2l: '', stat3v: '  ', stat3l: 'só legenda' });
    expect(container.querySelectorAll('.stat__value')).toHaveLength(1);
    expect(screen.getByText('só legenda')).toBeInTheDocument();
  });
  it('sem nenhum destaque não sobra a área vazia', () => {
    const { container } = setup({});
    expect(container.querySelector('.stats')).toBeNull();
  });
});
