export function scorePlaces(places, filters) {
  const transport = filters.transport || 'car'

  const filtered = places.filter((place) => {
    const budgetOk = !filters.budgetMax || place.avgCheck <= filters.budgetMax
    const typeOk = filters.types.length === 0 || filters.types.includes(place.venueType)
    const ratingOk = !filters.minRating || place.rating >= filters.minRating
    const travelOk = !filters.maxTravel || place.travel[transport] <= filters.maxTravel
    return budgetOk && typeOk && ratingOk && travelOk
  })

  const scored = filtered.map((place) => {
    const ratingScore = (place.rating / 5) * 30
    const budgetScore = filters.budgetMax
      ? Math.max(0, 1 - place.avgCheck / filters.budgetMax) * 25
      : 18
    const travelScore = filters.maxTravel
      ? Math.max(0, 1 - place.travel[transport] / filters.maxTravel) * 25
      : 18
    const typeScore = filters.types.length === 0
      ? 14
      : (filters.types.includes(place.venueType) ? 20 : 0)

    const total = ratingScore + budgetScore + travelScore + typeScore

    return {
      ...place,
      matchScore: Math.round(Math.min(99, total + 8)),
      shortWhy: buildExplanation(place, filters, transport),
    }
  })

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5)
}

export function findRestrictiveFilter(places, filters) {
  const transport = filters.transport || 'car'
  const checks = [
    {
      key: 'budget',
      label: 'бюджет',
      count: places.filter((p) => !filters.budgetMax || p.avgCheck <= filters.budgetMax).length,
      hint: 'Попробуй увеличить бюджет.'
    },
    {
      key: 'rating',
      label: 'рейтинг',
      count: places.filter((p) => !filters.minRating || p.rating >= filters.minRating).length,
      hint: 'Попробуй снизить минимальный рейтинг.'
    },
    {
      key: 'travel',
      label: 'время в пути',
      count: places.filter((p) => !filters.maxTravel || p.travel[transport] <= filters.maxTravel).length,
      hint: 'Попробуй увеличить время в пути.'
    },
    {
      key: 'type',
      label: 'тип заведения',
      count: places.filter((p) => filters.types.length === 0 || filters.types.includes(p.venueType)).length,
      hint: 'Попробуй расширить тип заведения.'
    },
  ]

  return checks.sort((a, b) => a.count - b.count)[0]
}

function buildExplanation(place, filters, transport) {
  const bits = []
  if (place.rating >= 4.7) bits.push('Высокий рейтинг')
  bits.push(`${place.travel[transport]} мин от тебя`)
  if (!filters.budgetMax || place.avgCheck <= filters.budgetMax) bits.push('укладывается в бюджет')
  return `${bits.slice(0, 3).join(', ')}.`
}
