export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, Perú`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&accept-language=es`,
      {
        headers: {
          "User-Agent": "FreightFlowCRM/1.0",
          "Accept-Language": "es",
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      }
    }
    return null
  } catch {
    return null
  }
}
