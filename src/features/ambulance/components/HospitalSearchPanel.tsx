import { useState, useEffect, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import { Building2, Search, X, ChevronRight } from 'lucide-react';
import L from 'leaflet';
import {
  searchHospitalsByName,
  type LiveHospital,
} from '../../../services/hospitalSearchService';

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

interface HospitalMapPinsProps {
  hospitals: LiveHospital[];
  selectedHospitalId?: string;
  onSelect: (hospital: LiveHospital) => void;
}

export function HospitalMapPins({ hospitals, selectedHospitalId, onSelect }: HospitalMapPinsProps) {
  const map = useMap();

  const handleSelect = (h: LiveHospital) => {
    onSelect(h);
    map.flyTo([h.lat, h.lng], 15, { animate: true, duration: 1.2 });
  };

  return (
    <>
      {hospitals.map(h => (
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
    </>
  );
}

interface HospitalSidebarListProps {
  userPos: [number, number] | null;
  baseHospitals: LiveHospital[];
  onSelect: (hospital: LiveHospital) => void;
  selectedHospitalId?: string;
  radiusMeters: number;
  onExtendRadius: () => void;
  onSearchUpdate: (hospitals: LiveHospital[]) => void;
}

export function HospitalSidebarList({
  userPos,
  baseHospitals,
  onSelect,
  selectedHospitalId,
  radiusMeters,
  onExtendRadius,
  onSearchUpdate,
}: HospitalSidebarListProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LiveHospital[] | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced text search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults(null);
      onSearchUpdate(baseHospitals);
      return;
    }
    
    debounceRef.current = setTimeout(async () => {
      if (!userPos) return;
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      try {
        const results = await searchHospitalsByName(query.trim(), userPos, abortRef.current.signal);
        setSearchResults(results);
        onSearchUpdate(results);
      } catch {
        // ignore abort
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [query, userPos, baseHospitals, onSearchUpdate]);

  const displayList = searchResults !== null ? searchResults : baseHospitals;
  const maxRadiusKm = radiusMeters / 1000;

  return (
    <div className="flex flex-col h-full overflow-hidden w-full relative">
      {/* Search Bar */}
      <div className="p-4 border-b border-navy-800 bg-navy-900/50 shrink-0">
        <div className="flex items-center gap-2 bg-navy-950 border border-navy-800 rounded-lg px-3 py-2.5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
          {loading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
          ) : (
            <Search className="w-4 h-4 text-navy-400 shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search within ${maxRadiusKm} km…`}
            className="flex-1 text-sm text-white placeholder-navy-500 bg-transparent outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-navy-400 hover:text-white cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-navy-950/30">
        {displayList.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center mb-4 border border-navy-800">
              <Building2 className="w-6 h-6 text-navy-500" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No hospitals found</h3>
            <p className="text-xs text-navy-400 mb-6 max-w-[200px]">
              We couldn't find any emergency facilities within {maxRadiusKm} km.
            </p>
            <button
              onClick={onExtendRadius}
              className="text-xs font-bold bg-navy-800 text-white hover:bg-navy-700 hover:text-white px-4 py-2 rounded-lg border border-navy-700 transition-colors"
            >
              Extend Search Radius
            </button>
          </div>
        )}

        {displayList.map((h, i) => {
          const isSelected = h.id === selectedHospitalId;
          const distKm = h.distanceMeters / 1000;
          const urgencyColor = distKm < 3 ? 'text-emerald-400' : distKm < 8 ? 'text-amber-400' : 'text-blue-400';
          
          return (
            <button
              key={h.id}
              onClick={() => onSelect(h)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-navy-800/50 hover:bg-navy-900 transition-colors cursor-pointer ${
                isSelected ? 'bg-navy-800/80 border-l-2 border-l-emerald-500' : 'border-l-2 border-l-transparent'
              }`}
            >
              {/* Rank / Icon */}
              <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                i === 0 && !searchResults ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-navy-800 text-navy-400 border border-navy-700'
              }`}>
                {i === 0 && !searchResults ? '★' : i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-bold leading-tight truncate ${isSelected ? 'text-emerald-400' : 'text-gray-100'}`}>
                    {h.name}
                  </h4>
                  <span className={`text-[11px] font-mono font-bold shrink-0 bg-navy-900 px-1.5 py-0.5 rounded border border-navy-800 ${urgencyColor}`}>
                    {h.distanceLabel}
                  </span>
                </div>
                {h.address && (
                  <p className="text-[11px] text-navy-400 mt-1 leading-tight line-clamp-2">{h.address}</p>
                )}
                {h.phone && (
                  <p className="text-[10px] text-blue-400 mt-1.5 font-mono">{h.phone}</p>
                )}
              </div>
              
              <div className="shrink-0 flex items-center justify-center self-center pl-2">
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-navy-600'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
