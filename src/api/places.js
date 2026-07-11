// TODO: Move to server-side endpoint only.
// TODO: Integrate with 2GIS Places API using process.env.TWO_GIS_API_KEY.
// TODO: Search venues by category, location, rating, reviews, attributes.
// TODO: Normalize 2GIS response into app Place model.

export async function fetchPlaces({ location, filters }) {
  void location
  void filters
  return { data: [], source: 'mock' }
}
