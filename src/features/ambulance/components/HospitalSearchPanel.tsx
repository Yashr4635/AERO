/**
 * HospitalSearchPanel
 * Floating live hospital search on the map.
 * – Immediately loads real nearby hospitals via Overpass (within 15 km).
 * – Debounced text search via Nominatim.
 * – Results shown in a scrollable card below the search bar.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  searchNearbyHospitals,
  searchHospitalsByName,
  type LiveHospital,
} from '../../../services/hospitalSearchService';

interface HospitalSearchPanelProps {
  /** Driver's current GPS position */
  userPos: [number, number] | null;
  /** Called when user selects a hospital from search results */
  onSelect: (hospital: LiveHospital) => void;
  /** Which hospital is currently selected */
  selectedHospitalId?: string;
  /** Radius cap in metres — default 15000 */
  radiusMeters?: number;
}

// Pin icon for search results
function searchResultIcon(selected: boolean) {
  const color = selected ? '#10b981' : '#3b82f6';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22s14-12.667 14-22C28 6.268 21.732 0 14 0z"
      fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="7" fill="white" opacity="0.9"/>
    <text x="14" y="18" text-anchor="middle" font-size="10" fill="${color}" font-weight="bold" font-family="sans-serif">H</text>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
}



export function HospitalSearchPanel({
  userPos,
  onSelect,
  selectedHospitalId,
  radiusMeters = 15000,
}: HospitalSearchPanelProps) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [hospitals, setHospitals] = useState<LiveHospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mapPins, setMapPins] = useState<LiveHospital[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load real nearby hospitals on mount / when GPS position becomes available
  const loadNearby = useCallback(async () => {
    if (!userPos) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const results = await searchNearbyHospitals(userPos, radiusMeters, abortRef.current.signal);
      setHospitals(results);
      setMapPins(results.slice(0, 20)); // show up to 20 pins
    } catch {
      // Overpass timed out or offline — silent
    } finally {
      setLoading(false);
    }
  }, [userPos, radiusMeters]);

  useEffect(() => {
    loadNearby();
  }, [loadNearby]);

  // Debounced text search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      loadNearby();
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (!userPos) return;
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const results = await searchHospitalsByName(query.trim(), userPos, abortRef.current.signal);
        setHospitals(results);
        setMapPins(results.slice(0, 20));
      } catch {
        // ignore abort
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [query, userPos, loadNearby]);

  const handleSelect = (h: LiveHospital) => {
    onSelect(h);
    map.flyTo([h.lat, h.lng], 15, { animate: true, duration: 1.2 });
    setOpen(false);
    setQuery('');
  };

  const maxRadiusKm = radiusMeters / 1000;

  return (
    <>
      {/* Map pins for search results */}
      {mapPins.map(h => (
        <Marker
          key={h.id}
          position={[h.lat, h.lng]}
          icon={searchResultIcon(h.id === selectedHospitalId)}
          zIndexOffset={h.id === selectedHospitalId ? 1000 : 500}
          eventHandlers={{ click: () => handleSelect(h) }}
        >
          <Popup className="aero-custom-popup">
            <div className="font-sans p-1 min-w-[180px]">
              <p className="font-bold text-sm text-gray-900">{h.name}</p>
              {h.address && <p className="text-xs text-gray-500 mt-0.5 leading-tight">{h.address.slice(0, 60)}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  {h.distanceLabel}
                </span>
                <button
                  onClick={() => handleSelect(h)}
                  className="text-xs bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-emerald-500 cursor-pointer"
                >
                  Select
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Floating search panel — absolute positioned over map */}
      <div className="absolute top-14 left-3 z-[500] w-[320px] max-w-[calc(100vw-1.5rem)] pointer-events-auto">

        {/* Search bar */}
        <div className={`flex items-center gap-2 bg-white shadow-lg border rounded-2xl px-3 py-2 transition-all ${open ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}`}>
          {loading ? (
            <svg className="animate-spin w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={`Search hospitals within ${maxRadiusKm} km…`}
            className="flex-1 text-xs text-gray-800 placeholder-gray-400 bg-transparent outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
          {open && (
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0 text-[10px] font-medium"
            >
              ESC
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {open && (
          <div className="mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-[340px] flex flex-col">
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {loading ? 'Searching live map data…' : `${hospitals.length} hospitals within ${maxRadiusKm} km`}
              </span>
              {!loading && hospitals.length > 0 && (
                <span className="text-[10px] text-blue-500 font-medium">📡 Live Map Data</span>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {hospitals.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <span className="text-2xl mb-2">🏥</span>
                  <p className="text-xs text-gray-500 font-medium">No hospitals found nearby</p>
                  <p className="text-[10px] text-gray-400 mt-1">Try a different search or extend the radius</p>
                </div>
              )}
              {hospitals.map((h, i) => {
                const isSelected = h.id === selectedHospitalId;
                const distKm = h.distanceMeters / 1000;
                const urgencyColor = distKm < 3 ? 'text-emerald-600' : distKm < 8 ? 'text-amber-600' : 'text-blue-600';
                return (
                  <div key={h.id} className="flex flex-col border-b border-gray-50 last:border-0">
                    <button
                      onClick={() => handleSelect(h)}
                      className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-blue-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50 border-emerald-100' : ''
                      }`}
                    >
                      {/* Rank badge */}
                      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        i === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {i === 0 ? '★' : i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-emerald-700' : 'text-gray-800'}`}>
                            {h.name}
                          </p>
                          <span className={`text-[11px] font-mono font-bold shrink-0 ${urgencyColor}`}>
                            {h.distanceLabel}
                          </span>
                        </div>
                        {h.address && (
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate">{h.address}</p>
                        )}
                        {h.businessStatus && (
                          <p className={`text-[10px] mt-0.5 font-bold ${h.businessStatus === 'OPERATIONAL' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {h.businessStatus.replace('_', ' ')}
                          </p>
                        )}
                        {h.phone && (
                          <p className="text-[10px] text-blue-500 mt-0.5 font-mono">{h.phone}</p>
                        )}
                      </div>

                      {isSelected && (
                        <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </button>
                    {h.googleMapsUri && (
                      <div className="px-3 pb-2 pt-1 flex justify-end">
                         <a href={h.googleMapsUri} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-500 hover:text-blue-600 underline">
                           [ OPEN IN GOOGLE MAPS ]
                         </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
