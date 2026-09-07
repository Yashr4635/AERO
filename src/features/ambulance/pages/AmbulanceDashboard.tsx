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
import { HospitalSearchPanel } from '../components/HospitalSearchPanel';
import { realtimeService } from '../../../services/realtimeService';
import { routingService } from '../../../services/routingService';
import { geolocationService, type GeoLocationResult } from '../../../services/geolocationService';
import { searchNearbyHospitals, type LiveHospital } from '../../../services/hospitalSearchService';
import type {
  EmergencyIncident,
  EmergencyCategory,
  EmergencyPriority,
  Hospital,
} from '../../../types';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitalsLoaded, setHospitalsLoaded] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [routeInfo, setRouteInfo] = useState<any | null>(null);

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

  // Sync GPS to Supabase actively if emergency is active
  useEffect(() => {
    if (activeIncident && gpsLocation) {
      if (locationUpdateInterval.current) clearInterval(locationUpdateInterval.current);
      
      locationUpdateInterval.current = setInterval(() => {
        supabase.from('emergency_incidents').update({
          current_latitude: gpsLocation.latitude,
          current_longitude: gpsLocation.longitude,
          current_speed: (gpsLocation.speed || 0) * 3.6,
          current_heading: (gpsLocation as any).heading || 0,
        }).eq('id', activeIncident.id).then(({ error }: any) => {
          if (error) console.error("Failed to sync GPS to Supabase:", error);
        });
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
      setLoadingHospitals(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        let results = await searchNearbyHospitals(pos, INITIAL_RADIUS_M, abortRef.current.signal);
        
        if (results.length === 0) {
          results = await searchNearbyHospitals(pos, MAX_RADIUS_M, abortRef.current.signal);
        }

        if (results.length > 0) {
          const ranked = await routingService.rankHospitalsByTravelTime(pos, results.slice(0, 5));
          setLiveHospitals(ranked);
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
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchAndRankHospitals();
  }, [gpsLocation, hospitalsLoaded, activeIncident]);

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

  return (
    <AppShell
      userRole="AMBULANCE"
      userName={`${ambulance.name} (${ambulance.vehicleNumber})`}
      connectionState={realtimeService.getConnectionState()}
      gpsState={gpsEnabled ? 'active' : (gpsError ? 'unavailable' : 'acquiring')}
      gpsAccuracy={currentAccuracy}
    >
      <div className="flex flex-col h-full overflow-hidden relative">
        
        {/* Float GPS Status */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-6 left-4 z-[400] bg-bg-surface backdrop-blur-md border border-border-subtle rounded-xl p-3 shadow-md pointer-events-auto flex items-center gap-3"
        >
          <div className="relative flex items-center justify-center">
            {gpsEnabled ? (
              <>
                <span className="absolute w-full h-full rounded-full bg-[#20D67A]/20 animate-ping"></span>
                <div className="w-2.5 h-2.5 bg-[#20D67A] rounded-full"></div>
              </>
            ) : (
              <div className="w-2.5 h-2.5 bg-[#FFB020] rounded-full"></div>
            )}
          </div>
          <div>
            <div className="telemetry-label">GPS Status</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {gpsEnabled ? `Active (±${Math.round(currentAccuracy)}m)` : (gpsError ? 'Unavailable' : 'Searching...')}
            </div>
            {gpsEnabled && (
              <div className="text-[10px] text-text-secondary font-mono mt-0.5">
                {currentPos[0].toFixed(5)}, {currentPos[1].toFixed(5)}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Map ── */}
        <div className="flex-1 relative min-h-0 bg-bg-main">
          <MapView center={currentPos} zoom={15} showLiveLocation={true}>
            <HospitalSearchPanel
              userPos={gpsEnabled ? [currentPos[0], currentPos[1]] : null}
              onSelect={handleSearchSelect}
              selectedHospitalId={selectedHospital?.id}
              radiusMeters={INITIAL_RADIUS_M}
            />

            <AmbulanceMarker
              position={currentPos}
              heading={(gpsLocation as any)?.heading || ambulance.heading}
              label={ambulance.name}
              speedKmH={gpsLocation?.speed ? (gpsLocation.speed * 3.6) : ambulance.speedKmH}
              vehicleNumber={ambulance.vehicleNumber}
              isSOS={!!activeIncident}
            />

            {!activeIncident && liveHospitals.map(h => (
               <HospitalMarker
                 key={h.id}
                 position={[h.lat, h.lng]}
                 name={h.name}
                 address={h.address}
                 availableIcuBeds={0}
                 traumaBaysAvailable={0}
                 phone={h.phone}
               />
            ))}

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

        {/* ── Control Panel ── */}
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-bg-surface border-t border-border-subtle p-4 shrink-0 z-10 shadow-none"
        >
          <AnimatePresence mode="wait">
            {!activeIncident ? (
              <motion.div 
                key="setup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6"
              >
                
                <div className="flex-1 enterprise-card p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white tracking-wide">EMERGENCY PROFILE</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="enterprise-input"
                    />
                    <Select
                      label="Triage Priority"
                      value={priority}
                      onChange={e => setPriority(e.target.value as EmergencyPriority)}
                      options={[
                        { value: 'CODE_RED', label: '🔴 Code Red — Immediate' },
                        { value: 'CODE_AMBER', label: '🟠 Code Amber — Urgent' },
                        { value: 'CODE_YELLOW', label: '🟡 Code Yellow — Moderate' },
                      ]}
                      className="enterprise-input"
                    />
                  </div>
                </div>

                <div className="w-full lg:w-[400px] flex flex-col justify-end">
                  {selectedHospital ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full rounded-xl bg-bg-main border border-border-subtle overflow-hidden shadow-md flex flex-col"
                    >
                      <div className="p-4 flex flex-col gap-3">
                        <div>
                          <h4 className="text-lg font-bold text-white">{selectedHospital.name}</h4>
                          <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{selectedHospital.address}</p>
                        </div>
                        
                        <div className="pt-2">
                          <SOSController
                            hospital={selectedHospital}
                            ambulanceId={ambulance.id}
                            currentPos={currentPos}
                            patientData={{ category, priority, chiefComplaint: `${category} — ${priority}` }}
                            onEmergencyActive={() => {}} // Supabase handles state update naturally
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-full py-8 rounded-xl bg-bg-main border border-border-subtle border-dashed text-center flex flex-col items-center justify-center gap-3 h-full min-h-[160px]">
                      {loadingHospitals ? (
                        <>
                          <div className="w-6 h-6 border-2 border-[#35C7FF] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[#35C7FF] text-xs font-bold uppercase tracking-widest">Finding nearby hospitals...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">No Reachable Hospitals</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto h-full"
              >
                <ActiveEmergencyView
                  emergency={activeIncident}
                  hospitalName={activeIncident.destination_hospital}
                  currentSpeedKmH={gpsLocation?.speed ? gpsLocation.speed * 3.6 : 0}
                  onCancel={() => setActiveIncident(null)}
                  onComplete={() => setActiveIncident(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppShell>
  );
}
