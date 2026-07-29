export default function BlogPostLoading() {
  return (
    <div className="content-container pb-24">
      <div className="mx-auto max-w-[760px] pb-10 pt-16">
        <div className="mb-6 h-4 w-24 animate-pulse rounded bg-white/[0.06]" />
        <div className="mb-5 flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
        <div className="mb-4 h-10 w-full animate-pulse rounded bg-white/[0.08]" />
        <div className="mb-6 h-10 w-2/3 animate-pulse rounded bg-white/[0.08]" />
        <div className="h-4 w-48 animate-pulse rounded bg-white/[0.05]" />
      </div>

      <div className="mx-auto flex max-w-[700px] flex-col gap-y-4">
        {[
          "w-full",
          "w-full",
          "w-5/6",
          "w-full",
          "w-3/4",
          "w-full",
          "w-4/6",
        ].map((width, index) => (
          <div
            key={index}
            className={`h-4 animate-pulse rounded bg-white/[0.05] ${width}`}
          />
        ))}
      </div>
    </div>
  )
}
