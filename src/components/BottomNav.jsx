export default function BottomNav({ current, onChange }) {
  const items = [
    { key: 'discover', label: 'Discover' },
    { key: 'saved', label: 'Saved' },
    { key: 'profile', label: 'Profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-line bg-white/95 px-4 pb-6 pt-3 backdrop-blur">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`rounded-2xl px-3 py-3 text-sm ${current === item.key ? 'bg-ink text-white' : 'bg-soft text-muted'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
