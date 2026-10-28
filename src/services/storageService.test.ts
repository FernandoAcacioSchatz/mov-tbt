import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES, validateImageFile } from './storageService';

describe('validateImageFile', () => {
  it('aceita imagens comuns', () => { expect(validateImageFile({ type: 'image/png', size: 1000 })).toBeNull(); });
  it('recusa tipos perigosos', () => {
    expect(validateImageFile({ type: 'image/svg+xml', size: 10 })).not.toBeNull();
    expect(validateImageFile({ type: 'text/html', size: 10 })).not.toBeNull();
    expect(validateImageFile({ type: 'application/pdf', size: 10 })).not.toBeNull();
  });
  it('recusa arquivos grandes', () => { expect(validateImageFile({ type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1 })).not.toBeNull(); });
});
