interface Props {
  onPrev: () => void;
  onNext: () => void;
  paused: boolean;
  onTogglePause: () => void;
  label: string;
}

export function CarouselControls({ onPrev, onNext, paused, onTogglePause, label }: Props) {
  return (
    <div className="arrows" role="group" aria-label={`Controles: ${label}`}>
      <button type="button" className="arrow" onClick={onPrev} aria-label="Anterior">←</button>
      <button type="button" className="arrow arrow--pause" onClick={onTogglePause} aria-label={paused ? 'Retomar rotação automática' : 'Pausar rotação automática'} aria-pressed={paused}>
        {paused ? '▶' : '❚❚'}
      </button>
      <button type="button" className="arrow" onClick={onNext} aria-label="Próximo">→</button>
    </div>
  );
}
