export default function SettingsLoading() {
  return (
    <div
      className="mx-auto w-full max-w-4xl px-4 py-8"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="mb-8 h-8 w-32 animate-pulse rounded-md bg-muted" />
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="grid gap-6 border-t py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:gap-12"
        >
          <div className="space-y-2">
            <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-full max-w-sm animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}
