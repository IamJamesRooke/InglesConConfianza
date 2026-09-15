export default function PracticeLoading() {
  return (
    <main
      className="learner-theme lesson-session-loading"
      role="status"
      aria-label="Preparando tu lección"
    >
      <p className="sr-only">Preparando tu lección…</p>
      <div className="loading-skel loading-stage-progress" />
      <div className="loading-skel loading-stage-line" />
    </main>
  );
}
