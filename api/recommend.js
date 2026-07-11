import { scorePlaces, findRestrictiveFilter } from '../src/lib/recommendation.js'

const TWO_GIS_PLACES_URL = 'https://catalog.api.2gis.com/3.0/items'
const TWO_GIS_ROUTING_URL = 'https://routing.api.2gis.com/routing/7.0.0/global'
const DEFAULT_AI_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions'

const SYSTEM_PROMPT = 'Ты — recommendation engine приложения BITE. Работай только с местами из входного массива. Нельзя придумывать названия, рейтинги, отзывы, цены, адреса, расстояния, время в пути и факты. Ранжируй места по совпадению с фильтрами. Объяснение должно быть на русском, максимум 14 слов. Возвращай только валидный JSON без markdown.'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const validation = validateRequest(body)

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const { location, budget_max_kzt, venue_types, min_rating, max_travel_minutes, transport_mode, query } = body

    const parsed_intent = {
      budget_max_kzt,
      venue_types,
      min_rating,
      max_travel_minutes,
      transport_mode,
      query: query || null,
    }

    const useMock = !process.env.TWO_GIS_API_KEY || !process.env.AI_API_KEY

    if (useMock) {
      const { mockPlaces } = await import('../src/data/mockPlaces.js')
      const fallback = buildFallbackFromMock({
        parsed_intent,
        places: mockPlaces,
        budget_max_kzt,
        venue_types,
        min_rating,
        max_travel_minutes,
        transport_mode,
      })
      return res.status(200).json(fallback)
    }

    const places = await fetch2GISPlaces({ location, venueTypes: venue_types, minRating: min_rating })
    const routedPlaces = await enrichWithRoutes({ location, places, transportMode: transport_mode })

    const filteredPlaces = routedPlaces.filter((place) => {
      const budgetOk = !budget_max_kzt || (place.avgCheck && place.avgCheck <= budget_max_kzt)
      const typeOk = !venue_types?.length || venue_types.includes(place.venueType)
      const ratingOk = !min_rating || (place.rating && place.rating >= min_rating)
      const travelOk = !max_travel_minutes || (place.travelMinutes && place.travelMinutes <= max_travel_minutes)
      return budgetOk && typeOk && ratingOk && travelOk
    })

    const payloadForAI = filteredPlaces.map((place) => ({
      place_id: place.id,
      name: place.name,
      venue_type: place.venueType,
      category: place.category,
      rating: place.rating,
      reviews_count: place.reviews,
      avg_check_kzt: place.avgCheck,
      address: place.address,
      distance_km: place.distanceKm,
      travel_minutes: place.travelMinutes,
    }))

    const aiJson = await callAI({ parsed_intent, places: payloadForAI })

    const relaxation_suggestion_ru = filteredPlaces.length < 3
      ? buildRelaxationSuggestion({ places: routedPlaces, filters: toLocalFilters(body) })
      : null

    return res.status(200).json({
      parsed_intent: aiJson.parsed_intent || parsed_intent,
      recommendations: Array.isArray(aiJson.recommendations) ? aiJson.recommendations : [],
      relaxation_suggestion_ru,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to build recommendations',
      details: error.message,
    })
  }
}

function validateRequest(body) {
  if (!body?.location) return { valid: false, error: 'location is required' }
  if (typeof body.location.latitude !== 'number') return { valid: false, error: 'location.latitude must be a number' }
  if (typeof body.location.longitude !== 'number') return { valid: false, error: 'location.longitude must be a number' }
  if (!Array.isArray(body.venue_types)) return { valid: false, error: 'venue_types must be an array' }
  return { valid: true }
}

async function fetch2GISPlaces({ location, venueTypes, minRating }) {
  const params = new URLSearchParams({
    key: process.env.TWO_GIS_API_KEY,
    q: 'еда',
    point: `${location.longitude},${location.latitude}`,
    radius: '5000',
    fields: 'items.point,items.reviews,items.contact_groups,items.schedule',
    page_size: '20',
  })

  const response = await fetch(`${TWO_GIS_PLACES_URL}?${params.toString()}`)
  if (!response.ok) throw new Error('2GIS Places API request failed')

  const json = await response.json()
  const items = json?.result?.items || []

  return items
    .map(normalize2GISPlace)
    .filter((place) => place)
    .filter((place) => !venueTypes?.length || venueTypes.includes(place.venueType))
    .filter((place) => !minRating || (place.rating && place.rating >= minRating))
}

function normalize2GISPlace(item) {
  const rating = Number(item?.reviews?.general_rating || 0)
  const reviews = Number(item?.reviews?.org_reviews_count || 0)
  const avgCheck = extractAvgCheck(item)
  const category = item?.rubrics?.[0]?.name || 'Place'
  const venueType = mapVenueType(category)

  if (!item?.id || !item?.name || !item?.point) return null

  return {
    id: String(item.id),
    name: item.name,
    category,
    venueType,
    rating,
    reviews,
    avgCheck,
    address: item?.address_name || '',
    point: item.point,
  }
}

function extractAvgCheck(item) {
  const text = item?.ad_attributes?.average_bill || item?.average_bill || null
  if (!text) return null
  const match = String(text).replace(/\s/g, '').match(/(\d{3,6})/)
  return match ? Number(match[1]) : null
}

function mapVenueType(category) {
  const c = String(category).toLowerCase()
  if (c.includes('bar')) return 'bar'
  if (c.includes('fast')) return 'fast food'
  if (c.includes('restaurant') || c.includes('ресторан')) return 'restaurant'
  return 'cafe'
}

async function enrichWithRoutes({ location, places, transportMode }) {
  const results = await Promise.all(
    places.map(async (place) => {
      const route = await fetchRoute({
        origin: location,
        destination: {
          latitude: place.point.lat,
          longitude: place.point.lon,
        },
        transportMode,
      })

      return {
        ...place,
        travelMinutes: route.travelMinutes,
        distanceKm: route.distanceKm,
      }
    })
  )

  return results
}

async function fetchRoute({ origin, destination, transportMode }) {
  const body = {
    locale: 'ru',
    transport: transportMode === 'walk' ? 'pedestrian' : 'car',
    points: [
      { type: 'stop', lon: origin.longitude, lat: origin.latitude },
      { type: 'stop', lon: destination.longitude, lat: destination.latitude },
    ],
  }

  const response = await fetch(`${TWO_GIS_ROUTING_URL}?key=${process.env.TWO_GIS_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error('2GIS Routing API request failed')

  const json = await response.json()
  const route = json?.result?.[0] || {}
  const distanceMeters = Number(route?.total_distance || 0)
  const durationSeconds = Number(route?.total_duration || 0)

  return {
    distanceKm: Number((distanceMeters / 1000).toFixed(1)),
    travelMinutes: Math.round(durationSeconds / 60),
  }
}

async function callAI({ parsed_intent, places }) {
  const response = await fetch(DEFAULT_AI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({ parsed_intent, places })
        }
      ],
    }),
  })

  if (!response.ok) throw new Error('AI API request failed')

  const json = await response.json()
  const content = json?.choices?.[0]?.message?.content
  return JSON.parse(content)
}

function buildFallbackFromMock({ parsed_intent, places, budget_max_kzt, venue_types, min_rating, max_travel_minutes, transport_mode }) {
  const localFilters = {
    budgetMax: budget_max_kzt,
    types: venue_types,
    minRating: min_rating,
    maxTravel: max_travel_minutes,
    transport: transport_mode,
  }

  const scored = scorePlaces(places, localFilters)

  return {
    parsed_intent,
    recommendations: scored.map((place, index) => ({
      place_id: place.id,
      rank: index + 1,
      match_score: place.matchScore,
      reason_ru: trimReason(place.shortWhy),
    })),
    relaxation_suggestion_ru: scored.length < 3
      ? buildRelaxationSuggestion({ places, filters: localFilters })
      : null,
  }
}

function buildRelaxationSuggestion({ places, filters }) {
  const restriction = findRestrictiveFilter(places, filters)
  return restriction?.hint || null
}

function trimReason(text) {
  const words = String(text).replace(/\.$/, '').split(/\s+/)
  return words.slice(0, 14).join(' ')
}

function toLocalFilters(body) {
  return {
    budgetMax: body.budget_max_kzt,
    types: body.venue_types,
    minRating: body.min_rating,
    maxTravel: body.max_travel_minutes,
    transport: body.transport_mode,
  }
}
