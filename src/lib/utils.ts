/** Haversine distance between two lat/lng points, returns km */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Format km distance for display */
export function formatKm(km: number): string {
  if (km < 1)  return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

/** Geocode a location string via Nominatim (free, no API key required) */
export async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch { /* silent — geocoding is best-effort */ }
  return null
}

/** Validate a username string. Returns an error message or null if valid. */
export function validateUsername(
  username: string,
  email: string,
  isDeveloperEmail = false,
  isEarlyAccessEmail = false,
): string | null {
  const minLen = isDeveloperEmail ? 1 : isEarlyAccessEmail ? 2 : 3
  if (username.length < minLen) return `Username must be at least ${minLen} character${minLen > 1 ? 's' : ''}`
  if (username.length > 30) return 'Username must be 30 characters or fewer'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Only letters, numbers, and underscores allowed'
  return null
}

export const DEV_EMAIL          = 'viktormaras2011@gmail.com'
export const EARLY_ACCESS_EMAIL = 'tanemscully@gmail.com'
