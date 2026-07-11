export function parseAiQuery(query) {
  const text = query.toLowerCase()

  const budgetMatch = text.match(/(\d+[\s\d]*)\s*000|до\s*(\d+[\s\d]*)/)
  let budget = 10000
  if (text.includes('не очень дорого')) budget = 10000
  if (text.includes('дёшево') || text.includes('дешево') || text.includes('бюджет')) budget = 6000
  if (budgetMatch) {
    const raw = (budgetMatch[1] || budgetMatch[2] || '').replace(/\s/g, '')
    const n = Number(raw)
    if (!Number.isNaN(n) && n > 0) budget = n < 1000 ? n * 1000 : n
  }

  const venueTypes = []
  if (text.includes('кафе')) venueTypes.push('cafe')
  if (text.includes('ресторан')) venueTypes.push('restaurant')
  if (text.includes('бар')) venueTypes.push('bar')
  if (text.includes('фаст') || text.includes('быстро')) venueTypes.push('fast food')
  if (venueTypes.length === 0) venueTypes.push('cafe', 'restaurant')

  let minRating = 4.5
  if (text.includes('топ') || text.includes('высокий рейтинг')) minRating = 4.7
  if (text.includes('без разницы')) minRating = 4.0

  let maxTravelMinutes = 20
  if (text.includes('рядом') || text.includes('близко')) maxTravelMinutes = 15

  const vibe = []
  if (text.includes('уют')) vibe.push('cozy')
  if (text.includes('свидан')) vibe.push('date')
  if (text.includes('атмосфер')) vibe.push('cozy')
  if (text.includes('быстро')) vibe.push('quick')

  return {
    budget_max_kzt: budget,
    venue_types: [...new Set(venueTypes)],
    min_rating: minRating,
    max_travel_minutes: maxTravelMinutes,
    vibe: [...new Set(vibe)],
  }
}
