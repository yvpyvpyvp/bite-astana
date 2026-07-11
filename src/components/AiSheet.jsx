export default function AiSheet({ open, query, parsed, onQueryChange, onApply }) {
  return (
    <div className={`fixed bottom-24 left-0 right-0 mx-auto max-w-md px-4 transition ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}>
      <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">AI assistant</h3>
          <span className="rounded-full bg-lime px-2 py-1 text-xs font-medium">JSON</span>
        </div>

        <textarea
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Хочу атмосферное место для свидания, чтобы было не очень дорого"
          className="mb-3 h-24 w-full rounded-2xl border border-line bg-soft px-4 py-3 outline-none"
        />

        <pre className="mb-3 overflow-auto rounded-2xl bg-ink p-3 text-xs text-lime">{JSON.stringify(parsed, null, 2)}</pre>

        <button onClick={onApply} className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white">
          Применить AI-фильтры
        </button>
      </div>
    </div>
  )
}
