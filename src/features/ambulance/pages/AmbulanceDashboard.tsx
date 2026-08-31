import { useState, useEffect, useMemo, useRef } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import {
  MapView,
  AmbulanceMarker,
  HospitalMarker,
  RoutePolyline,
} from '../../../components/map';
import { Select } from '../../../components/ui/Select';
import { SOSController } from '../components/SOSController';
import { ActiveEmergencyView } from '../components/ActiveEmergencyView';
import { HospitalMapPins, HospitalSidebarList } from '../components/HospitalSearchPanel';
import { realtimeService } from '../../../services/realtimeService';
import { routingService } from '../../../services/routingService';
import { ambulanceService } from '../../../services/ambulanceService';
import { geolocationService, type GeoLocationResult } from '../../../services/geolocationService';
import { searchNearbyHospitals, type LiveHospital } from '../../../services/hospitalSearchService';
import type {
  EmergencyIncident,
  EmergencyCategory,
  EmergencyPriority,
  Hospital,
} from '../../../types';


const INITIAL_RADIUS_M = 15000;
const MAX_RADIUS_M = 25000;

export function AmbulanceDashboard() {
  const [ambulance] = useState({
    id: 'AMB-001',
    name: 'AERO Life Support (ALS-1)',
    vehicleNumber: 'MH-12-AB-1234',
    heading: 0,
    speedKmH: 0,
  });

  // Map state
  const [gpsLocation, setGpsLocation] = useState<GeoLocationResult | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  // Hospital & Routing state
  const [liveHospitals, setLiveHospitals] = useState<any[]>([]);
  const [mapPins, setMapPins] = useState<LiveHospital[]>([]);
  const [hospitalsLoaded, setHospitalsLoaded] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [routeInfo, setRouteInfo] = useState<any | null>(null);
  const [searchRadius, setSearchRadius] = useState(INITIAL_RADIUS_M);

  // Emergency State
  const [category, setCategory] = useState<EmergencyCategory>('CARDIAC');
  const [priority, setPriority] = useState<EmergencyPriority>('CODE_RED');
  
  // Realtime active incident
  const [activeIncident, setActiveIncident] = useState<EmergencyIncident | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const locationUpdateInterval = useRef<any>(null);

  // Current Position Logic
  const currentPos: [number, number] = useMemo(() => 
    gpsLocation ? [gpsLocation.latitude, gpsLocation.longitude] : [17.44, 78.34],
  [gpsLocation]);

  const currentAccuracy = gpsLocation?.accuracy || 5;

  // 1. Initialize Realtime Services
  useEffect(() => {
    const unsub = realtimeService.on('incidents_updated', (incidents: EmergencyIncident[]) => {
      // Find the first active incident for this ambulance (user)
      const myActive = incidents.find(inc => inc.status === 'active' && inc.ambulance_id === ambulance.id);
      setActiveIncident(myActive || null);
    });
    return () => unsub();
  }, [ambulance.id]);

  // 2. Initialize Geolocation
  useEffect(() => {
    geolocationService.getCurrentPosition()
      .then(pos => {
        setGpsLocation(pos);
        setGpsEnabled(true);
        setGpsError(null);
      })
      .catch(err => {
        setGpsError(err.message || 'GPS denied or unavailable');
        setGpsEnabled(false);
      });

    geolocationService.startWatching();
    
    const unwatch = geolocationService.onUpdate((pos) => {
      setGpsLocation(pos);
      setGpsEnabled(true);
      setGpsError(null);
    });

    return () => {
      unwatch();
      geolocationService.stopWatching();
    };
  }, []);

  const lastRecalculationPos = useRef<[number, number] | null>(null);

  // Sync GPS to Supabase actively if emergency is active
  useEffect(() => {
    if (activeIncident && gpsLocation && gpsEnabled) {
      if (locationUpdateInterval.current) clearInterval(locationUpdateInterval.current);
      
      locationUpdateInterval.current = setInterval(() => {
        const current: [number, number] = [gpsLocation.latitude, gpsLocation.longitude];
        const dest: [number, number] = [activeIncident.destination_latitude, activeIncident.destination_longitude];
        
        let shouldRecalculate = false;
        
        // Only recalculate route if we moved more than ~50 meters since last recalculation
        if (!lastRecalculationPos.current) {
          shouldRecalculate = true;
          lastRecalculationPos.current = current;
        } else {
          const latDiff = Math.abs(current[0] - lastRecalculationPos.current[0]);
          const lngDiff = Math.abs(current[1] - lastRecalculationPos.current[1]);
          // rough approximation of 50m in degrees (~0.00045)
          if (latDiff > 0.00045 || lngDiff > 0.00045) {
            shouldRecalculate = true;
            lastRecalculationPos.current = current;
          }
        }

        ambulanceService.updateEmergencyLocation(
          activeIncident.id,
          current,
          gpsLocation.speed ? gpsLocation.speed * 3.6 : 0,
          dest,
          shouldRecalculate
        ).catch((e: any) => console.error("GPS Sync failed", e));
        
      }, 5000); // Throttled update to avoid rate limits
    } else {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
        locationUpdateInterval.current = null;
      }
    }

    return () => {
      if (locationUpdateInterval.current) clearInterval(locationUpdateInterval.current);
    };
  }, [activeIncident?.id, gpsLocation]);

  // 3. Auto-discover Hospitals
  useEffect(() => {
    if (!gpsLocation || hospitalsLoaded || activeIncident) return;

    const fetchAndRankHospitals = async () => {
      const pos: [number, number] = [gpsLocation.latitude, gpsLocation.longitude];
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        let results = await searchNearbyHospitals(pos, searchRadius, abortRef.current.signal);
        
        if (results.length === 0 && searchRadius < MAX_RADIUS_M) {
          results = await searchNearbyHospitals(pos, MAX_RADIUS_M, abortRef.current.signal);
          if (results.length > 0) setSearchRadius(MAX_RADIUS_M);
        }

        if (results.length > 0) {
          const ranked = await routingService.rankHospitalsByTravelTime(pos, results.slice(0, 5));
          setLiveHospitals(ranked);
          setMapPins(ranked);
          setHospitalsLoaded(true);

          if (ranked.length > 0) {
            const best = ranked[0];
            setSelectedHospital({
              id: best.id,
              name: best.name,
              address: best.address || best.name,
              location: { latitude: best.lat, longitude: best.lng },
              phone: best.phone || '',
              emergencyCapable: true,
              totalBeds: 0, availableIcuBeds: 0, traumaBaysAvailable: 0, doctorsOnDuty: 0,
              distanceKm: parseFloat((best.drivingDistanceMeters / 1000).toFixed(1)),
              drivingEtaSeconds: best.drivingEtaSeconds
            } as any);

            if (best.routePolyline) {
              setRouteInfo({
                polyline: best.routePolyline,
                etaSeconds: best.drivingEtaSeconds,
                distanceMeters: best.drivingDistanceMeters,
              });
            }
          }
        } else {
          setHospitalsLoaded(true);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') console.warn(err);
      }
    };

    fetchAndRankHospitals();
  }, [gpsLocation, hospitalsLoaded, activeIncident, searchRadius]);

  const handleSearchSelect = async (h: LiveHospital) => {
    const pos: [number, number] = [gpsLocation?.latitude || currentPos[0], gpsLocation?.longitude || currentPos[1]];
    
    const hosp: any = {
      id: h.id,
      name: h.name,
      address: h.address || h.name,
      location: { latitude: h.lat, longitude: h.lng },
      phone: h.phone || '',
      emergencyCapable: true,
      distanceKm: parseFloat((h.distanceMeters / 1000).toFixed(1)),
    };
    
    setSelectedHospital(hosp);
    
    try {
      const dest: [number, number] = [h.lat, h.lng];
      const route = await routingService.getLiveRoute(pos, dest);
      setRouteInfo(route);
      hosp.distanceKm = parseFloat((route.distanceMeters / 1000).toFixed(1));
      hosp.drivingEtaSeconds = route.etaSeconds;
      setSelectedHospital({...hosp});
    } catch (e) {
      setRouteInfo(null);
    }
  };

  const destinationPos: [number, number] | null = selectedHospital
    ? [selectedHospital.location.latitude, selectedHospital.location.longitude]
    : null;

  // ── Compute map bounds for auto-fitting ──
  // Only recalculate when hospital selection or route changes, NOT on GPS ticks
  const [mapFitTrigger, setMapFitTrigger] = useState(0);

  // Trigger map fit when hospital is selected or route changes
  const prevSelectedHospitalId = useRef<string | null>(null);
  const prevRouteKey = useRef<string | null>(null);

  useEffect(() => {
    const hospId = selectedHospital?.id || null;
    const routeKey = routeInfo ? `${routeInfo.distanceMeters}` : null;

    if (hospId !== prevSelectedHospitalId.current || routeKey !== prevRouteKey.current) {
      prevSelectedHospitalId.current = hospId;
      prevRouteKey.current = routeKey;
      if (hospId) {
        setMapFitTrigger(t => t + 1);
      }
    }
  }, [selectedHospital?.id, routeInfo]);

  const mapBounds = useMemo(() => {
    if (!destinationPos) return null;

    const points: [number, number][] = [currentPos];
    points.push(destinationPos);

    // Include route polyline coordinates for a better fit
    const routeCoords = activeIncident?.route_geometry || routeInfo?.polyline;
    if (routeCoords && Array.isArray(routeCoords) && routeCoords.length > 0) {
      // Sample every ~10th point to avoid expensive bounds calc on huge polylines
      const step = Math.max(1, Math.floor(routeCoords.length / 20));
      for (let i = 0; i < routeCoords.length; i += step) {
        const pt = routeCoords[i];
        if (Array.isArray(pt) && pt.length >= 2) {
          points.push(pt as [number, number]);
        }
      }
      // Always include the last point
      const last = routeCoords[routeCoords.length - 1];
      if (Array.isArray(last) && last.length >= 2) {
        points.push(last as [number, number]);
      }
    }

    return points as [number, number][];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFitTrigger, destinationPos?.[0], destinationPos?.[1]]);

  return (
    <AppShell
      userRole="AMBULANCE"
      userName={`${ambulance.name} (${ambulance.vehicleNumber})`}
      connectionState={realtimeService.getConnectionState()}
      gpsState={gpsEnabled ? 'active' : (gpsError ? 'unavailable' : 'acquiring')}
      gpsAccuracy={currentAccuracy}
    >
      <div className="flex flex-col lg:flex-row h-full overflow-hidden relative bg-[#0F1419]">
        
        {/* ── Sidebar ── */}
        <div className="w-full lg:w-[420px] shrink-0 border-r border-navy-800 flex flex-col bg-[#0F1419] overflow-hidden relative z-10 shadow-2xl">
          
          {/* 1. GPS Status Card */}
          <div className="p-4 border-b border-navy-800 bg-navy-900/40 flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center">
              {gpsEnabled ? (
                <>
                  <span className="absolute w-full h-full rounded-full bg-blue-500/20 animate-ping"></span>
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                </>
              ) : (
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-bold text-navy-400 uppercase tracking-widest">GPS Status</div>
              <div className="text-sm font-medium text-white flex items-center gap-2">
                {gpsEnabled ? `Active (±${Math.round(currentAccuracy)}m)` : (gpsError ? 'Unavailable' : 'Searching...')}
              </div>
              {gpsEnabled && (
                <div className="text-[10px] text-navy-400 font-mono mt-0.5">
                  {currentPos[0].toFixed(5)}, {currentPos[1].toFixed(5)}
                </div>
              )}
            </div>
          </div>

          {!activeIncident ? (
            <>
              {/* 2. Emergency Profile */}
              <div className="p-4 border-b border-navy-800 bg-[#0F1419] shrink-0">
                <h3 className="text-[10px] font-bold text-navy-400 tracking-widest uppercase mb-3">Emergency Profile</h3>
                <div className="flex flex-col gap-3">
                  <Select
                    label="Emergency Category"
                    value={category}
                    onChange={e => setCategory(e.target.value as EmergencyCategory)}
                    options={[
                      { value: 'CARDIAC', label: '🫀 Cardiac / STEMI' },
                      { value: 'TRAUMA', label: '💥 Severe Trauma' },
                      { value: 'STROKE', label: '🧠 Acute Stroke' },
                      { value: 'RESPIRATORY', label: '🫁 Respiratory Failure' },
                      { value: 'OBSTETRIC', label: '👶 Obstetric Emergency' },
                      { value: 'GENERAL', label: '🚨 General Critical' },
                    ]}
                  />
                  <Select
                    label="Triage Priority"
                    value={priority}
                    onChange={e => setPriority(e.target.value as EmergencyPriority)}
                    selectClassName={priority === 'CODE_RED' ? 'border-red-500 bg-red-900/20 text-red-100' : ''}
                    options={[
                      { value: 'CODE_RED', label: '🔴 Code Red — Immediate' },
                      { value: 'CODE_AMBER', label: '🟠 Code Amber — Urgent' },
                      { value: 'CODE_YELLOW', label: '🟡 Code Yellow — Moderate' },
                    ]}
                  />
                </div>
              </div>

              {/* 3. Hospital Search & List */}
              <div className="flex-1 overflow-hidden min-h-[300px]">
                <HospitalSidebarList
                  userPos={gpsEnabled ? [currentPos[0], currentPos[1]] : null}
                  baseHospitals={liveHospitals}
                  onSelect={handleSearchSelect}
                  selectedHospitalId={selectedHospital?.id}
                  radiusMeters={searchRadius}
                  onExtendRadius={() => {
                    setHospitalsLoaded(false);
                    setSearchRadius(r => r + 10000);
                  }}
                  onSearchUpdate={setMapPins}
                />
              </div>

              {/* 4. Action Area */}
              {selectedHospital && (
                <div className="p-4 border-t border-navy-800 bg-navy-950 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-white">{selectedHospital.name}</h4>
                    <p className="text-xs text-navy-400 mt-0.5 line-clamp-1">{selectedHospital.address}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <SOSController
                      hospital={selectedHospital}
                      ambulanceId={ambulance.id}
                      currentPos={currentPos}
                      patientData={{ category, priority, chiefComplaint: `${category} — ${priority}` }}
                      onEmergencyActive={() => {}}
                    />
                    <button
                      onClick={() => {
                        window.open(`https://www.google.com/maps/dir/${currentPos[0]},${currentPos[1]}/${selectedHospital.location.latitude},${selectedHospital.location.longitude}`, '_blank');
                      }}
                      className="w-full bg-navy-800 text-white font-bold py-2.5 rounded-lg border border-navy-700 hover:bg-navy-700 transition-colors text-sm"
                    >
                      OPEN DIRECTIONS
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <ActiveEmergencyView
                emergency={activeIncident}
                hospitalName={activeIncident.destination_hospital}
                currentSpeedKmH={gpsLocation?.speed ? gpsLocation.speed * 3.6 : 0}
                onCancel={() => setActiveIncident(null)}
                onComplete={() => setActiveIncident(null)}
              />
            </div>
          )}
        </div>

        {/* ── Map ── */}
        <div className="flex-1 relative min-h-0 bg-gray-900 z-0">
          <MapView
            center={currentPos}
            zoom={15}
            showLiveLocation={true}
            fitBounds={mapBounds}
            fitBoundsPadding={[440, 60]}
          >
            <HospitalMapPins 
              hospitals={mapPins} 
              selectedHospitalId={selectedHospital?.id} 
              onSelect={handleSearchSelect} 
            />

            <AmbulanceMarker
              position={currentPos}
              heading={(gpsLocation as any)?.heading || ambulance.heading}
              label={ambulance.name}
              speedKmH={gpsLocation?.speed ? (gpsLocation.speed * 3.6) : ambulance.speedKmH}
              vehicleNumber={ambulance.vehicleNumber}
              isSOS={!!activeIncident}
            />

            {destinationPos && selectedHospital && (
              <HospitalMarker
                position={destinationPos}
                name={selectedHospital.name}
                address={selectedHospital.address}
                availableIcuBeds={selectedHospital.availableIcuBeds}
                traumaBaysAvailable={selectedHospital.traumaBaysAvailable}
                phone={selectedHospital.phone}
              />
            )}

            {(routeInfo || activeIncident?.route_geometry) && (
              <RoutePolyline
                positions={activeIncident?.route_geometry || routeInfo?.polyline || []}
                congestionSegments={[]}
                active={!!activeIncident}
              />
            )}
          </MapView>
        </div>
      </div>
    </AppShell>
  );
}
