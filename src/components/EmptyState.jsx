export default function EmptyState({ title, subtitle }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white p-6 text-center">
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted">{subtitle}</p>
    </div>
  )
}
