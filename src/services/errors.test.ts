import { describe, expect, it } from 'vitest';
import { friendlyError } from './errors';

describe('friendlyError', () => {
  it('não vaza detalhes técnicos', () => {
    expect(friendlyError({ message: 'relation "x" does not exist', code: '42P01' }, 'Falhou.').message).toBe('Falhou.');
  });
  it('traduz permissão negada', () => {
    expect(friendlyError({ message: 'rls', code: '42501' }, 'x').message).toMatch(/permissão/);
  });
  it('repassa a mensagem de limite de envio do banco', () => {
    expect(friendlyError({ message: 'Muitas mensagens. Tente mais tarde.', code: 'P0001' }, 'x').message).toBe('Muitas mensagens. Tente mais tarde.');
  });
});
