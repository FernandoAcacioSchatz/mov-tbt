import { describe, expect, it } from 'vitest';
import { safeUrl, youtubeId } from './url';

describe('safeUrl', () => {
  it('aceita https e http', () => {
    expect(safeUrl('https://exemplo.com/a')).toBe('https://exemplo.com/a');
    expect(safeUrl('http://exemplo.com')).toBe('http://exemplo.com/');
  });
  it('bloqueia protocolos perigosos', () => {
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(safeUrl('vbscript:x')).toBeUndefined();
    expect(safeUrl('  JaVaScRiPt:alert(1)')).toBeUndefined();
  });
  it('ignora vazio e inválido', () => {
    expect(safeUrl('')).toBeUndefined();
    expect(safeUrl(null)).toBeUndefined();
    expect(safeUrl('não é url')).toBeUndefined();
  });
  it('aceita imagens do próprio site e recusa outros caminhos', () => {
    expect(safeUrl('/images/acervo/foto.webp')).toBe('/images/acervo/foto.webp');
    expect(safeUrl('/images/../index.html')).toBeUndefined();
    expect(safeUrl('//evil.com/images/x.png')).toBeUndefined();
    expect(safeUrl('/admin')).toBeUndefined();
  });
  it('reconhece links do YouTube', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=LgUFjTNg_UU')).toBe('LgUFjTNg_UU');
    expect(youtubeId('https://youtu.be/LgUFjTNg_UU')).toBe('LgUFjTNg_UU');
    expect(youtubeId('https://www.youtube.com/shorts/abc123DEF')).toBe('abc123DEF');
    expect(youtubeId('https://vimeo.com/123')).toBeNull();
  });
  it('httpsOnly recusa http', () => {
    expect(safeUrl('http://exemplo.com', { httpsOnly: true })).toBeUndefined();
  });
});
