export default function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="animate-pulse rounded-3xl border border-line bg-white p-4">
          <div className="mb-4 h-28 rounded-2xl bg-soft" />
          <div className="mb-2 h-5 w-2/3 rounded bg-soft" />
          <div className="mb-4 h-4 w-1/3 rounded bg-soft" />
          <div className="h-10 rounded-2xl bg-soft" />
        </div>
      ))}
    </div>
  )
}
