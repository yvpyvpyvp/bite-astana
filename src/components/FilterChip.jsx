export default function FilterChip({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition ${active ? 'border-lime bg-lime text-ink' : 'border-line bg-white text-ink'}`}
    >
      {label}
    </button>
  )
}
