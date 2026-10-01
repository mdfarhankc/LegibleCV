export default function DashboardLoading() {
  return (
    <div className="grid gap-8" aria-busy="true" aria-label="Loading your resumes">
      <div className="space-y-2">
        <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-[19.5rem] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
