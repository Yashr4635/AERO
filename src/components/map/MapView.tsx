import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Circle, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
  showControls?: boolean;
  showLiveLocation?: boolean;
  followLiveLocation?: boolean;
}

/* ── Live Location Tracker (blue pulsing dot + accuracy circle) ── */
function LiveLocationTracker({ follow = true }: { follow?: boolean }) {
  const map = useMap();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const watchIdRef = useRef<number | null>(null);
  const hasInitialCentered = useRef(false);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        setAccuracy(pos.coords.accuracy);

        // Auto-center on first fix, or continuously if follow mode is on
        if (follow && !hasInitialCentered.current) {
          map.flyTo(newPos, Math.max(map.getZoom(), 16), { duration: 1.2 });
          hasInitialCentered.current = true;
        } else if (follow) {
          map.panTo(newPos, { animate: true, duration: 0.5 });
        }
      },
      () => {
        // Silently handle error — location may not be available
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [map, follow]);

  if (!position) return null;

  return (
    <>
      {/* Accuracy radius circle */}
      <Circle
        center={position}
        radius={accuracy}
        pathOptions={{
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.1,
          weight: 1,
          opacity: 0.3,
        }}
      />
      {/* Outer pulsing ring */}
      <CircleMarker
        center={position}
        radius={14}
        pathOptions={{
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.15,
          weight: 2,
          opacity: 0.4,
        }}
      />
      {/* Inner solid blue dot */}
      <CircleMarker
        center={position}
        radius={7}
        pathOptions={{
          color: '#ffffff',
          fillColor: '#4285F4',
          fillOpacity: 1,
          weight: 2.5,
          opacity: 1,
        }}
      />
    </>
  );
}

/* ── Auto-Center on prop changes ── */
function MapAutoCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    map.panTo(center, { animate: true, duration: 0.6 });
  }, [center, map]);

  return null;
}

/* ── Recenter Control ── */
function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();

  return (
    <button
      onClick={() => map.flyTo(center, map.getZoom(), { duration: 0.8 })}
      className="w-9 h-9 bg-white/90 backdrop-blur border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-colors shadow-md cursor-pointer"
      aria-label="Recenter map"
      title="Recenter Map"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    </button>
  );
}

/* ── Zoom Controls ── */
function ZoomButtons() {
  const map = useMap();

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-white/90 backdrop-blur border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-colors shadow-md cursor-pointer font-bold text-lg"
        title="Zoom In"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-white/90 backdrop-blur border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-colors shadow-md cursor-pointer font-bold text-lg"
        title="Zoom Out"
      >
        −
      </button>
    </div>
  );
}

export function MapView({
  center,
  zoom = 14,
  children,
  className = '',
  showControls = true,
  showLiveLocation = true,
  followLiveLocation = false,
}: MapViewProps) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div className={`relative w-full h-full min-h-[300px] bg-navy-950 overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        {import.meta.env.VITE_MAP_ACCESS_TOKEN ? (
          <TileLayer
            url={`https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAP_ACCESS_TOKEN}`}
            attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
            maxZoom={20}
          />
        ) : (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        )}

        {/* Auto-center map when center prop changes */}
        <MapAutoCenter center={center} />

        {/* Live GPS blue dot */}
        {showLiveLocation && <LiveLocationTracker follow={followLiveLocation} />}

        {children}

        {/* Bottom Left Floating Controls */}
        {showControls && (
          <div className="leaflet-bottom leaflet-left" style={{ marginBottom: '16px', marginLeft: '16px' }}>
            <div className="leaflet-control flex flex-col gap-2 pointer-events-auto">
              <RecenterButton center={center} />
              <ZoomButtons />
              <button
                onClick={() => setShowLegend(!showLegend)}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors shadow-md cursor-pointer text-xs font-bold ${
                  showLegend 
                    ? 'bg-primary-600 text-white border-primary-500' 
                    : 'bg-white/90 backdrop-blur border-gray-200 text-gray-500 hover:text-gray-900'
                }`}
                title="Toggle Map Legend"
              >
                🗺️
              </button>
            </div>
          </div>
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-16 left-16 z-[400] bg-white/95 backdrop-blur border border-gray-200 rounded-xl p-3.5 shadow-lg text-xs max-w-xs animate-fade-in">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-200">
            <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">Map Legend</span>
            <button onClick={() => setShowLegend(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emergency-500 flex items-center justify-center text-[10px]">🚑</div>
              <span className="text-gray-700 font-medium">Emergency Ambulance (Live)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-700 flex items-center justify-center text-[10px]">🏥</div>
              <span className="text-gray-700 font-medium">Destination Hospital</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-sky-600 flex items-center justify-center text-[10px]">👮</div>
              <span className="text-gray-700 font-medium">Traffic Police Officer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span className="text-gray-700 font-medium">Your Live Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
              <span className="text-gray-600">Cleared Green-Wave Junction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-300" />
              <span className="text-gray-600">Preparing Junction Clearance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-500 flex items-center justify-center text-[9px]">⚠️</span>
              <span className="text-gray-600">Hazard / Road Blockage</span>
            </div>
          </div>
        </div>
      )}

      {/* Police-Assisted System Notice */}
      <div className="absolute bottom-2 right-4 z-[400] pointer-events-none">
        <span className="text-[10px] text-gray-400 bg-white/80 px-2 py-0.5 rounded border border-gray-200 font-mono">
          Police-Assisted Traffic Clearance • Leaflet/OSM
        </span>
      </div>
    </div>
  );
}

