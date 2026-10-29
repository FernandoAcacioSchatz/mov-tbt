/** Card mostrado enquanto não há nada publicado em Mídias, para a seção não ficar vazia. */
export function MediaEmpty() {
  return (
    <div className="media-empty">
      <div className="media-empty__art" aria-hidden="true">
        <span className="media-empty__sheet media-empty__sheet--1"><span /><span /><span /></span>
        <span className="media-empty__sheet media-empty__sheet--2"><span /><span /><span /></span>
        <span className="media-empty__sheet media-empty__sheet--3"><span className="media-empty__play">▶</span></span>
      </div>
      <div className="media-empty__body">
        <span className="media-empty__kicker">Em breve</span>
        <h3 className="media-empty__title">As manchetes estão a caminho</h3>
        <p className="media-empty__text">
          Estamos reunindo as matérias, entrevistas, vídeos e postagens que já falaram sobre a TBT. Logo, logo, tudo isso estará aqui.
        </p>
      </div>
    </div>
  );
}
