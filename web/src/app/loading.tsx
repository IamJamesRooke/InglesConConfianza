export default function Loading() {
  return (
    <main
      className="learner-theme home-page"
      aria-busy="true"
      aria-label="Cargando lecciones"
    >
      <div className="course-container learner-loading">
        <p className="sr-only" role="status">
          Preparando tus lecciones…
        </p>
        <div className="loading-hero">
          <div className="loading-skel loading-eyebrow" />
          <div className="loading-skel loading-headline loading-headline-1" />
          <div className="loading-skel loading-headline loading-headline-2" />
          <div className="loading-skel loading-pill" />
        </div>
        <div className="loading-feature loading-skel" />
        <div className="loading-row loading-skel" />
        <div className="loading-row loading-skel" />
      </div>
    </main>
  );
}
