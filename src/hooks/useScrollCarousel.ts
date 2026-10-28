import { useCallback, useEffect, useState } from 'react';

interface Options {
  count: number;
  /** milissegundos entre avanços automáticos; 0 desliga */
  interval: number;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Carrossel baseado em rolagem com snap. Avança sozinho, mas:
 * - respeita "reduzir movimento" do sistema (começa pausado);
 * - pausa ao passar o mouse / focar dentro;
 * - tem botão de pausa (WCAG 2.2.2).
 */
export function useScrollCarousel({ count, interval }: Options) {
  const [track, setTrack] = useState<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(() => prefersReducedMotion());
  const [hoverPaused, setHoverPaused] = useState(false);

  const scrollToIndex = useCallback((i: number) => {
    if (!track) return;
    const slide = track.children[i] as HTMLElement | undefined;
    if (!slide) return;
    const first = track.children[0] as HTMLElement;
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
    track.scrollTo({ left: slide.offsetLeft - first.offsetLeft, behavior });
  }, [track]);

  const goTo = useCallback((i: number) => {
    if (count === 0) return;
    const next = ((i % count) + count) % count;
    setIndex(next);
    scrollToIndex(next);
  }, [count, scrollToIndex]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // mantém o índice em sincronia quando a pessoa rola com o dedo/mouse
  const onScroll = useCallback(() => {
    if (!track || track.children.length === 0) return;
    const first = track.children[0] as HTMLElement;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < track.children.length; i += 1) {
      const dist = Math.abs((track.children[i] as HTMLElement).offsetLeft - first.offsetLeft - track.scrollLeft);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    setIndex((cur) => (cur === best ? cur : best));
  }, [track]);

  const running = interval > 0 && count > 1 && !userPaused && !hoverPaused;
  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => goTo(index + 1), interval);
    return () => window.clearInterval(id);
  }, [running, interval, goTo, index]);

  return {
    setTrack, index, next, prev, goTo, onScroll,
    paused: userPaused,
    togglePause: () => setUserPaused((p) => !p),
    hoverHandlers: {
      onMouseEnter: () => setHoverPaused(true),
      onMouseLeave: () => setHoverPaused(false),
      onFocus: () => setHoverPaused(true),
      onBlur: () => setHoverPaused(false),
    },
  };
}
