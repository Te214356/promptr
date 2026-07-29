const CardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-large border border-promptr-border bg-promptr-card">
    <div className="h-44 w-full animate-pulse bg-white/[0.04]" />
    <div className="flex flex-col gap-y-3 p-6">
      <div className="h-4 w-20 animate-pulse rounded-full bg-white/[0.06]" />
      <div className="h-5 w-4/5 animate-pulse rounded bg-white/[0.08]" />
      <div className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.05]" />
    </div>
  </div>
)

export default function BlogListLoading() {
  return (
    <div className="content-container py-16 small:py-24">
      <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-y-5">
        <div className="h-3 w-28 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-11 w-48 animate-pulse rounded bg-white/[0.08]" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-white/[0.05]" />
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col overflow-hidden rounded-large border border-promptr-border bg-promptr-card small:flex-row">
          <div className="h-56 w-full animate-pulse bg-white/[0.04] small:h-auto small:w-[46%]" />
          <div className="flex flex-1 flex-col gap-y-4 p-8">
            <div className="h-4 w-24 animate-pulse rounded-full bg-white/[0.06]" />
            <div className="h-8 w-4/5 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-4 w-full animate-pulse rounded bg-white/[0.05]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>

        <div className="grid gap-6 small:grid-cols-2 medium:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
