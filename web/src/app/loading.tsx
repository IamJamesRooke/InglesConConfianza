export default function Loading() {
  return (
    <main
      className="learner-theme"
      aria-busy="true"
      aria-label="Cargando lecciones"
    >
      <div className="course-container learner-loading">
        <p className="sr-only" role="status">
          Preparando tus lecciones…
        </p>
        <div className="loading-line" />
        <div className="loading-feature" />
        <div className="loading-row" />
        <div className="loading-row" />
      </div>
    </main>
  );
}
