import { describe, expect, it } from 'vitest';
import { fillPlaceholders } from './useTexts';

describe('marcadores automáticos dos textos', () => {
  const content = { members: Array.from({ length: 8 }, () => ({}) as never) };
  it('troca {integrantes}, {anos} e {ano}', () => {
    expect(fillPlaceholders('{integrantes}', content, 2026)).toBe('8');
    expect(fillPlaceholders('{anos} anos', content, 2026)).toBe('21 anos');
    expect(fillPlaceholders('difusão do teatro em {ano}', content, 2027)).toBe('difusão do teatro em 2027');
  });
  it('acompanha a quantidade de integrantes', () => {
    expect(fillPlaceholders('{integrantes}', { members: [] }, 2026)).toBe('0');
  });
  it('deixa o texto comum como está', () => {
    expect(fillPlaceholders('1x/mês', content, 2026)).toBe('1x/mês');
  });
});
