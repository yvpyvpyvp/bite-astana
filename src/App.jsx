import { useMemo, useState, useEffect } from 'react'
import { LocateFixed, Sparkles, MapPinned, AlertCircle, ShieldQuestion } from 'lucide-react'
import { mockPlaces, savedMockIds } from './data/mockPlaces'
import { budgetOptions, ratingOptions, transportOptions, travelOptions, typeOptions } from './data/options'
import { parseAiQuery } from './lib/aiParser'
import { findRestrictiveFilter, scorePlaces } from './lib/recommendation'
import FilterChip from './components/FilterChip'
import PlaceCard from './components/PlaceCard'
import BottomNav from './components/BottomNav'
import LoadingSkeleton from './components/LoadingSkeleton'
import EmptyState from './components/EmptyState'
import AiSheet from './components/AiSheet'

const initialFilters = {
  budgetMax: 10000,
  types: ['cafe', 'restaurant'],
  minRating: 4.5,
  maxTravel: 15,
  transport: 'car',
}

export default function App() {
  const [screen, setScreen] = useState('discover')
  const [location, setLocation] = useState('Astana, Kazakhstan')
  const [query, setQuery] = useState('уютное кафе для свидания до 10 000 ₸')
  const [filters, setFilters] = useState(initialFilters)
  const [sortBy, setSortBy] = useState('match')
  const [saved, setSaved] = useState(savedMockIds)
  const [showAi, setShowAi] = useState(false)
  const [loading, setLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [geoPromptVisible, setGeoPromptVisible] = useState(true)

  const parsed = useMemo(() => parseAiQuery(query), [query])

  const results = useMemo(() => {
    const base = scorePlaces(mockPlaces, filters)
    if (sortBy === 'distance') return [...base].sort((a, b) => a.distanceKm - b.distanceKm)
    if (sortBy === 'rating') return [...base].sort((a, b) => b.rating - a.rating)
    if (sortBy === 'price') return [...base].sort((a, b) => a.avgCheck - b.avgCheck)
    return base
  }, [filters, sortBy])

  const restriction = useMemo(() => findRestrictiveFilter(mockPlaces, filters), [filters])

  useEffect(() => {
    const value = window.localStorage.getItem('bite_geo_prompt_seen')
    if (value === 'true') setGeoPromptVisible(false)
  }, [])

  const handleUseLocation = () => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Геолокация недоступна на этом устройстве.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocation('Текущая геолокация · Астана')
        setLoading(false)
        setGeoPromptVisible(false)
        window.localStorage.setItem('bite_geo_prompt_seen', 'true')
      },
      () => {
        setGeoError('Нет доступа к геолокации.')
        setLoading(false)
        setGeoPromptVisible(false)
        window.localStorage.setItem('bite_geo_prompt_seen', 'true')
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }

  const dismissGeoPrompt = () => {
    setGeoPromptVisible(false)
    window.localStorage.setItem('bite_geo_prompt_seen', 'true')
  }

  const applyAiFilters = () => {
    setFilters((prev) => ({
      ...prev,
      budgetMax: parsed.budget_max_kzt,
      types: parsed.venue_types,
      minRating: parsed.min_rating,
      maxTravel: parsed.max_travel_minutes,
    }))
    setScreen('discover')
    setShowAi(false)
  }

  const toggleSave = (id) => {
    setSaved((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const savedPlaces = mockPlaces.filter((p) => saved.includes(p.id))

  return (
    <div className="mx-auto min-h-screen max-w-md bg-soft px-4 pb-28 pt-5 text-ink">
      {geoPromptVisible && (
        <div className="mb-4 rounded-3xl border border-line bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime text-ink">
              <ShieldQuestion size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold">Использовать геолокацию?</h3>
              <p className="text-sm text-muted">Это улучшит точность рекомендаций и время в пути.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleUseLocation} className="flex-1 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white">
              Разрешить
            </button>
            <button onClick={dismissGeoPrompt} className="flex-1 rounded-2xl bg-soft px-4 py-3 text-sm font-medium text-ink">
              Позже
            </button>
          </div>
        </div>
      )}

      <header className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight">BITE</div>
            <p className="text-sm text-muted">Где поесть сейчас?</p>
          </div>
          <button
            onClick={() => setShowAi((v) => !v)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-lime"
          >
            <Sparkles size={18} />
          </button>
        </div>
      </header>

      {screen === 'discover' && (
        <main className="space-y-5">
          <section className="rounded-3xl border border-line bg-white p-4 shadow-card">
            <label className="mb-2 block text-sm text-muted">Твоя локация</label>
            <div className="mb-3 flex gap-2">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-2xl border border-line bg-soft px-4 py-3 outline-none"
              />
              <button onClick={handleUseLocation} className="rounded-2xl bg-lime px-4 text-ink">
                <LocateFixed size={18} />
              </button>
            </div>

            <label className="mb-2 block text-sm text-muted">AI-запрос</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-4 h-24 w-full rounded-2xl border border-line bg-soft px-4 py-3 outline-none"
              placeholder="Например: уютное кафе для свидания до 10 000 ₸"
            />

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Бюджет</p>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                  {budgetOptions.map((value) => (
                    <FilterChip
                      key={value}
                      active={filters.budgetMax === value}
                      label={value >= 15000 ? '15 000 ₸+' : `до ${value.toLocaleString('ru-RU')} ₸`}
                      onClick={() => setFilters((p) => ({ ...p, budgetMax: value }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Тип</p>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                  {typeOptions.map((value) => (
                    <FilterChip
                      key={value}
                      active={filters.types.includes(value)}
                      label={value === 'fast food' ? 'Fast food' : value.charAt(0).toUpperCase() + value.slice(1)}
                      onClick={() => setFilters((p) => ({
                        ...p,
                        types: p.types.includes(value) ? p.types.filter((t) => t !== value) : [...p.types, value],
                      }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Минимальный рейтинг</p>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                  {ratingOptions.map((value) => (
                    <FilterChip
                      key={value}
                      active={filters.minRating === value}
                      label={`${value}+`}
                      onClick={() => setFilters((p) => ({ ...p, minRating: value }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Время в пути</p>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                  {travelOptions.map((value) => (
                    <FilterChip
                      key={value}
                      active={filters.maxTravel === value}
                      label={`до ${value} минут`}
                      onClick={() => setFilters((p) => ({ ...p, maxTravel: value }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Способ передвижения</p>
                <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                  {transportOptions.map((item) => (
                    <FilterChip
                      key={item.value}
                      active={filters.transport === item.value}
                      label={item.label}
                      onClick={() => setFilters((p) => ({ ...p, transport: item.value }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button className="mt-5 w-full rounded-2xl bg-ink px-4 py-4 text-sm font-semibold text-white">
              Найти место
            </button>
          </section>

          {geoError && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} /> {geoError}
            </div>
          )}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Результаты</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-2xl border border-line bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="match">Лучшее совпадение</option>
                <option value="distance">Ближе</option>
                <option value="rating">Выше рейтинг</option>
                <option value="price">Дешевле</option>
              </select>
            </div>

            <div className="mb-4 flex h-40 items-end rounded-3xl border border-line bg-gradient-to-br from-ink to-neutral-700 p-4 text-white shadow-card">
              <div>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-lime text-ink">
                  <MapPinned size={18} />
                </div>
                <p className="text-lg font-semibold">Карта Астаны</p>
                <p className="text-sm text-white/70">Map placeholder для 2GIS SDK</p>
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : results.length === 0 ? (
              <EmptyState
                title="Ничего не найдено"
                subtitle={`${restriction.hint} Сейчас самый строгий фильтр — ${restriction.label}.`}
              />
            ) : (
              <div className="space-y-3">
                {results.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    transport={filters.transport}
                    onSave={toggleSave}
                    saved={saved.includes(place.id)}
                  />
                ))}
                {results.length < 3 && (
                  <EmptyState
                    title="Мало вариантов"
                    subtitle={`${restriction.hint} Это даст больше точных рекомендаций.`}
                  />
                )}
              </div>
            )}
          </section>
        </main>
      )}

      {screen === 'saved' && (
        <main className="space-y-4">
          <h2 className="text-xl font-semibold">Saved</h2>
          {savedPlaces.length === 0 ? (
            <EmptyState title="Пока пусто" subtitle="Сохрани интересные места, чтобы вернуться к ним позже." />
          ) : (
            savedPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={{ ...place, matchScore: 94, shortWhy: place.explanation }}
                transport={filters.transport}
                onSave={toggleSave}
                saved
              />
            ))
          )}
        </main>
      )}

      {screen === 'profile' && (
        <main className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-5 shadow-card">
            <p className="mb-1 text-sm text-muted">Профиль</p>
            <h2 className="text-2xl font-semibold">BITE user</h2>
            <p className="mt-3 text-sm text-muted">Любимые места, история поисков и персональные AI-предпочтения будут здесь.</p>
          </div>
          <EmptyState title="Скоро" subtitle="Этот экран подготовлен для следующих итераций MVP." />
        </main>
      )}

      <AiSheet
        open={showAi}
        query={query}
        parsed={parsed}
        onQueryChange={setQuery}
        onApply={applyAiFilters}
      />

      <BottomNav current={screen} onChange={setScreen} />
    </div>
  )
}
