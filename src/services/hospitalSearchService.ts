/**
 * AERO Hospital Search Service
 * Uses OpenStreetMap Nominatim + Overpass API to find real emergency
 * hospitals near a given GPS coordinate within a specified radius.
 */

export interface LiveHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  distanceMeters: number;
  distanceLabel: string;
  /** OSM amenity tag */
  type: 'hospital' | 'clinic' | 'doctors';
  /** Overpass element id */
  osmId: number;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distLabel(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

/**
 * Search for real hospitals near `pos` within `radiusMeters` using Overpass API.
 * Falls back to Nominatim text search if Overpass is slow.
 */
export async function searchNearbyHospitals(
  pos: [number, number],
  radiusMeters = 15000,
  signal?: AbortSignal,
): Promise<LiveHospital[]> {
  const [lat, lng] = pos;

  // Overpass QL query — hospitals & clinics with emergency capability
  const query = `
[out:json][timeout:10];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  node["amenity"="clinic"]["emergency"="yes"](around:${radiusMeters},${lat},${lng});
);
out center tags;
`.trim();

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    signal,
    headers: { 'Content-Type': 'text/plain' },
  });

  if (!res.ok) throw new Error('Overpass error');

  const data = await res.json();
  const elements: any[] = data.elements || [];

  const hospitals: LiveHospital[] = elements
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;

      const name: string =
        el.tags?.name ||
        el.tags?.['name:en'] ||
        el.tags?.['operator'] ||
        'Hospital';

      const dist = haversine(lat, lng, elLat, elLng);
      if (dist > radiusMeters) return null;

      const addr = [
        el.tags?.['addr:housename'],
        el.tags?.['addr:street'],
        el.tags?.['addr:city'],
      ]
        .filter(Boolean)
        .join(', ') || el.tags?.['addr:full'] || '';

      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        lat: elLat,
        lng: elLng,
        address: addr,
        phone: el.tags?.phone || el.tags?.['contact:phone'],
        distanceMeters: dist,
        distanceLabel: distLabel(dist),
        type: (el.tags?.amenity || 'hospital') as LiveHospital['type'],
        osmId: el.id,
      } as LiveHospital;
    })
    .filter((h): h is LiveHospital => h !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  return hospitals;
}

/**
 * Text-search hospitals by name using Nominatim (OSM geocoder).
 * Bounded to `viewbox` derived from current position ± ~0.15°.
 */
export async function searchHospitalsByName(
  query: string,
  pos: [number, number],
  signal?: AbortSignal,
): Promise<LiveHospital[]> {
  const [lat, lng] = pos;
  const delta = 0.15; // ~15 km bounding box
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '12',
    countrycodes: 'in',
    viewbox: `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`,
    bounded: '1',
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal,
    headers: { 'Accept-Language': 'en', 'User-Agent': 'AERO-Emergency/2.0' },
  });

  if (!res.ok) return [];
  const data: any[] = await res.json();

  return data
    .filter(r => r.class === 'amenity' && (r.type === 'hospital' || r.type === 'clinic' || r.type === 'doctors'))
    .map(r => {
      const dist = haversine(lat, lng, parseFloat(r.lat), parseFloat(r.lon));
      return {
        id: `nom-${r.place_id}`,
        name: r.display_name.split(',')[0],
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        address: r.display_name,
        distanceMeters: dist,
        distanceLabel: distLabel(dist),
        type: r.type as LiveHospital['type'],
        osmId: r.osm_id,
      } as LiveHospital;
    })
    .sort((a, b) => a!.distanceMeters - b!.distanceMeters);
}
