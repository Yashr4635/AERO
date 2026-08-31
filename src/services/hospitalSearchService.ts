import { supabase } from '../lib/supabase';
/**
 * AERO Hospital Search Service
 * Uses Google Places API (New) via proxy to find real emergency
 * hospitals near a given GPS coordinate within a specified radius.
 * Falls back to OpenStreetMap Overpass if Google fails.
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
  /** Primary classification */
  type: 'hospital' | 'clinic' | 'doctors';
  /** External place identifier */
  osmId?: number;
  googleMapsUri?: string;
  businessStatus?: string;
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
 * Search for real hospitals near `pos` within `radiusMeters` using Google Places API (via backend proxy).
 * Falls back to Overpass API if the proxy fails.
 */
export async function searchNearbyHospitals(
  pos: [number, number],
  radiusMeters = 15000,
  signal?: AbortSignal,
): Promise<LiveHospital[]> {
  const [lat, lng] = pos;

  // 1. Try Google Places API Proxy
  try {
    console.log(`[AERO HOSPITAL] Querying Google Places API proxy for hospitals...`);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || '';

    const res = await fetch('http://localhost:3001/api/places/hospitals', {
      method: 'POST',
      signal,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ latitude: lat, longitude: lng, radius: radiusMeters })
    });

    if (res.ok) {
      const data = await res.json();
      const places = data.places || [];
      console.log(`[AERO HOSPITAL] Google Places returned ${places.length} results.`);
      
      const hospitals: LiveHospital[] = places.map((place: any) => {
        const pLat = place.location?.latitude;
        const pLng = place.location?.longitude;
        const dist = pLat && pLng ? haversine(lat, lng, pLat, pLng) : 0;
        
        return {
          id: place.id,
          name: place.displayName?.text || 'Unnamed Hospital',
          lat: pLat || lat,
          lng: pLng || lng,
          address: place.formattedAddress || '',
          distanceMeters: dist,
          distanceLabel: distLabel(dist),
          type: 'hospital',
          googleMapsUri: place.googleMapsUri,
          businessStatus: place.businessStatus
        };
      }).sort((a: any, b: any) => a.distanceMeters - b.distanceMeters);

      if (hospitals.length > 0) {
        return hospitals;
      }
    } else {
      const errorText = await res.text();
      console.warn(`[AERO HOSPITAL] Google Places Proxy failed: HTTP ${res.status} - ${errorText}`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError' && signal?.aborted) throw err;
    console.warn(`[AERO HOSPITAL] Google Places Proxy request error: ${err.message}`);
  }

  // 2. Fallback to OpenStreetMap Overpass if Google failed
  console.log(`[AERO HOSPITAL] Falling back to OpenStreetMap Overpass...`);
  const query = `
[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  node["amenity"="clinic"]["emergency"="yes"](around:${radiusMeters},${lat},${lng});
);
out center tags;
`.trim();

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter'
  ];

  let data = null;

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 
      const combinedSignal = signal ? (signal.aborted ? signal : controller.signal) : controller.signal;

      if (signal && !signal.aborted) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: query,
        signal: combinedSignal,
        headers: { 'Content-Type': 'text/plain' },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        data = await res.json();
        break; 
      }
    } catch (err: any) {
      if (err.name === 'AbortError' && signal?.aborted) throw err;
    }
  }

  if (!data || !data.elements) {
    console.error('[AERO HOSPITAL] All hospital discovery methods failed. Returning empty list.');
    return []; // STRICT REQUIREMENT: NO FALLBACK/MOCK ARRAYS.
  }

  const elements: any[] = data.elements || [];
  
  const hospitals: LiveHospital[] = elements
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;

      const name: string = el.tags?.name || el.tags?.['name:en'] || el.tags?.['operator'] || 'Unnamed Hospital';
      const dist = haversine(lat, lng, elLat, elLng);
      if (dist > radiusMeters) return null;

      const addr = [el.tags?.['addr:housename'], el.tags?.['addr:street'], el.tags?.['addr:city']]
        .filter(Boolean)
        .join(', ') || el.tags?.['addr:full'] || 'Address unavailable';

      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        lat: elLat,
        lng: elLng,
        address: addr,
        phone: el.tags?.phone || el.tags?.['contact:phone'] || 'Phone unavailable',
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
  const delta = 0.15; 
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '12',
    countrycodes: 'in',
    viewbox: `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`,
    bounded: '1',
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      signal,
      headers: { 'Accept-Language': 'en', 'User-Agent': 'AERO-Emergency/2.0' },
    });

    if (res.ok) {
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
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.error('[AERO HOSPITAL] Nominatim search failed.');
  }

  // STRICT REQUIREMENT: NO FALLBACK/MOCK ARRAY.
  return [];
}
