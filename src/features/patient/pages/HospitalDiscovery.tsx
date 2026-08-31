import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { searchNearbyHospitals, type LiveHospital } from '../../../services/hospitalSearchService';
import { MapContainer, TileLayer, CircleMarker, Marker, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reusable Map Auto-Center
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

// Custom Marker Icons using simple HTML since we don't want complex assets
const hospitalIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div style="width: 24px; height: 24px; background-color: white; border: 2px solid #DC2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); font-size: 14px;">🏥</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const selectedHospitalIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<div style="width: 32px; height: 32px; background-color: #DC2626; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(220,38,38,0.6); font-size: 16px;">🏥</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const RADIUS_OPTIONS = [1, 2, 5, 10, 25];

export function HospitalDiscovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: geoState, coordinates, error: geoError, requestLocation } = useGeolocation();
  
  // Grab emergencyId from router state if we came from RequestAmbulance
  const emergencyId = location.state?.emergencyId || 'emg-demo123';
  
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [hospitals, setHospitals] = useState<LiveHospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  // Initial location request
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Trigger search when coordinates or radius changes
  useEffect(() => {
    if (geoState === 'success' && coordinates) {
      handleSearch(coordinates, radiusKm);
    }
  }, [geoState, coordinates, radiusKm]);

  const handleSearch = async (pos: [number, number], radius: number) => {
    setLoading(true);
    setSearchError(null);
    setSelectedHospitalId(null);
    try {
      // searchNearbyHospitals expects meters
      const results = await searchNearbyHospitals(pos, radius * 1000);
      setHospitals(results);
      if (results.length === 0) {
        setSearchError(`No hospitals found within ${radius} km. Try expanding your search radius.`);
      }
    } catch (err: any) {
      setSearchError('Unable to find nearby hospitals right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospital = (hospital: LiveHospital) => {
    setSelectedHospitalId(hospital.id);
    // In the real workflow, you would set this as the selected destination.
  };

  const handleGetDirections = (hospital: LiveHospital) => {
    // Open Google Maps directions in new tab
    if (coordinates) {
      const url = `https://www.google.com/maps/dir/${coordinates[0]},${coordinates[1]}/${hospital.lat},${hospital.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-[#111827] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
        <h1 className="font-extrabold text-xl tracking-tight text-[#111827]">Nearby Hospitals</h1>
        <button 
          onClick={() => navigate('/request')}
          className="text-sm font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          Back
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left/Top: Map Area */}
        <div className="flex-1 min-h-[40vh] lg:min-h-0 relative bg-[#E5E7EB] z-0">
          {(geoState === 'loading' || (loading && hospitals.length === 0)) && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-semibold text-[#4B5563]">Locating nearest emergency centers...</p>
            </div>
          )}

          {geoState === 'denied' && (
            <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-[#DC2626] mb-4 text-2xl">
                📍
              </div>
              <h2 className="text-xl font-bold mb-2">Location Required</h2>
              <p className="text-[#6B7280] mb-6 max-w-sm">
                {geoError || 'Please enable location access to find real hospitals near you.'}
              </p>
              <button 
                onClick={() => requestLocation()}
                className="bg-[#111827] text-white px-6 py-3 rounded-lg font-bold"
              >
                Retry Location
              </button>
            </div>
          )}

          {coordinates && geoState === 'success' && (
            <MapContainer
              center={coordinates}
              zoom={14}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapUpdater center={coordinates} />

              {/* User Location Marker */}
              <CircleMarker
                center={coordinates}
                radius={8}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#2563EB',
                  fillOpacity: 1,
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]} className="font-bold text-xs">
                  You
                </Tooltip>
              </CircleMarker>

              {/* Radius Circle */}
              <CircleMarker
                center={coordinates}
                radius={radiusKm * 15} // visual approximation
                pathOptions={{
                  color: '#2563EB',
                  fillColor: '#2563EB',
                  fillOpacity: 0.05,
                  weight: 1,
                  dashArray: '4 4'
                }}
              />

              {/* Hospital Markers */}
              {hospitals.map((hospital) => (
                <Marker 
                  key={hospital.id}
                  position={[hospital.lat, hospital.lng]}
                  icon={hospital.id === selectedHospitalId ? selectedHospitalIcon : hospitalIcon}
                  eventHandlers={{
                    click: () => handleSelectHospital(hospital),
                  }}
                >
                  <Tooltip direction="bottom" offset={[0, 10]} className="font-bold shadow-md rounded">
                    {hospital.name}
                  </Tooltip>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Right/Bottom: List Area */}
        <div className="flex-[0.8] lg:max-w-md w-full bg-white border-l border-[#E5E7EB] flex flex-col z-10 shadow-xl lg:shadow-none overflow-hidden">
          {/* Radius Selector */}
          <div className="p-4 border-b border-[#E5E7EB] bg-gray-50 shrink-0">
            <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">Search Radius</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {RADIUS_OPTIONS.map((km) => (
                <button
                  key={km}
                  onClick={() => setRadiusKm(km)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-colors ${
                    radiusKm === km 
                      ? 'bg-[#111827] text-white' 
                      : 'bg-white border border-[#D1D5DB] text-[#4B5563] hover:bg-gray-100'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {searchError && (
            <div className="p-6 text-center shrink-0">
              <div className="inline-flex bg-red-50 text-[#DC2626] p-4 rounded-xl mb-4">
                ⚠️
              </div>
              <p className="text-[#4B5563] font-medium">{searchError}</p>
            </div>
          )}

          {/* Hospital List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {!loading && hospitals.map((hospital) => {
              const isSelected = selectedHospitalId === hospital.id;
              
              return (
                <div 
                  key={hospital.id}
                  onClick={() => handleSelectHospital(hospital)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#DC2626] bg-red-50/30 shadow-md' 
                      : 'border-[#E5E7EB] hover:border-[#D1D5DB] hover:shadow-sm bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-lg pr-4 leading-tight ${isSelected ? 'text-[#DC2626]' : 'text-[#111827]'}`}>
                      {hospital.name}
                    </h3>
                    <div className="shrink-0 bg-gray-100 px-2 py-1 rounded text-xs font-bold text-[#4B5563]">
                      {hospital.distanceLabel}
                    </div>
                  </div>
                  
                  <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
                    {hospital.address}
                  </p>
                  
                  {isSelected && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-red-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to track ambulance flow with selected hospital
                          navigate(`/track/${emergencyId}`);
                        }}
                        className="flex-1 bg-[#DC2626] text-white font-bold py-2.5 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm text-center"
                      >
                        SELECT
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(hospital);
                        }}
                        className="flex-1 bg-white border-2 border-[#D1D5DB] text-[#374151] font-bold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm text-center"
                      >
                        DIRECTIONS
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
