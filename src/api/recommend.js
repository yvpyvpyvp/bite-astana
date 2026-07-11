// TODO: Server-side only. Never expose AI_API_KEY in browser-side code.
// TODO: Send structured filters + real places data + route data to AI model API.
// TODO: Receive ranking and short explanation strings.
// TODO: Add fallback to deterministic local ranking when AI is unavailable.

export async function fetchRecommendations({ filters, places, routes }) {
  void filters
  void places
  void routes
  return { data: [], source: 'mock' }
}
