import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Footer } from '../../src/components/layout/Footer';
import { ContentProvider } from '../../src/hooks/useContent';
import type { SiteContent } from '../../src/types/content';

const content: SiteContent = { texts: { footer: '© 2005 Movimento TBT', socInstagram: 'https://instagram.com/x', socYoutube: 'javascript:alert(1)' }, shows: [], members: [], videos: [], podcasts: [], photos: [] };

describe('Footer', () => {
  it('mostra as redes sociais como logos e ignora endereço perigoso ou vazio', () => {
    render(<MemoryRouter><ContentProvider initial={content}><Footer /></ContentProvider></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Instagram/ })).toHaveAttribute('href', 'https://instagram.com/x');
    expect(screen.queryByRole('link', { name: /YouTube/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Spotify/ })).not.toBeInTheDocument();
  });
});
