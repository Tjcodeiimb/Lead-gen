/** Shown instantly while a page loads (or builds for the first time in development). */
export default function Loading() {
  return (
    <div className="fade-up">
      <div className="h-9 w-64 rounded-xl bg-line animate-pulse mb-3" />
      <div className="h-4 w-96 max-w-full rounded-lg bg-line animate-pulse mb-10" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
      </div>
      <div className="card h-64 animate-pulse" />
    </div>
  );
}
