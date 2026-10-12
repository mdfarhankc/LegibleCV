// Same frame as the editor, so nothing jumps when the resume arrives.
export default function EditorLoading() {
  return (
    <div
      className="flex h-[calc(100dvh-3.5rem-1px)] flex-col"
      aria-busy="true"
      aria-label="Loading the editor"
    >
      <div className="flex shrink-0 items-center gap-4 border-b px-4 py-3">
        <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
        <div className="ml-auto h-8 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="mx-auto grid min-h-0 w-full max-w-[100rem] flex-1 xl:grid-cols-[minmax(0,46rem)_minmax(0,1fr)]">
        <div className="grid content-start gap-4 px-4 py-4">
          <div className="h-7 w-full max-w-md animate-pulse rounded-md bg-muted" />
          <div className="h-10 animate-pulse rounded-md bg-muted" />
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="hidden px-4 py-4 xl:block">
          <div className="h-full animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
