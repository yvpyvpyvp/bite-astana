import { Navigation, Bookmark } from 'lucide-react'

export default function PlaceCard({ place, transport, onSave, saved }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-card">
      <div className="mb-4 flex gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-ink text-lg font-semibold text-lime">
          {place.image}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="truncate text-lg font-semibold">{place.name}</h3>
              <p className="text-sm text-muted">{place.category} · {place.area}</p>
            </div>
            <div className="rounded-full bg-lime px-3 py-1 text-xs font-semibold text-ink">
              {place.matchScore}% match
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink">
            <span className="rounded-full bg-soft px-2 py-1">2GIS {place.rating}</span>
            <span className="rounded-full bg-soft px-2 py-1">{place.reviews} отзывов</span>
            <span className="rounded-full bg-soft px-2 py-1">~ {place.avgCheck.toLocaleString('ru-RU')} ₸</span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm">
        <span>{place.distanceKm} км · {place.travel[transport]} мин</span>
        <span className="text-muted">{place.shortWhy}</span>
      </div>

      <div className="flex gap-3">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white">
          <Navigation size={16} /> Маршрут
        </button>
        <button
          onClick={() => onSave(place.id)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium ${saved ? 'bg-lime text-ink' : 'bg-soft text-ink'}`}
        >
          <Bookmark size={16} /> {saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}
