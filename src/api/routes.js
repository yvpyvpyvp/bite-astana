// TODO: Move to server-side endpoint only.
// TODO: Integrate with 2GIS Routing API using process.env.TWO_GIS_API_KEY.
// TODO: Calculate travel time and distance for walk/car/taxi.
// TODO: Merge route metrics back into place results.

export async function fetchRoutes({ origin, destinations, mode }) {
  void origin
  void destinations
  void mode
  return { data: [], source: 'mock' }
}
