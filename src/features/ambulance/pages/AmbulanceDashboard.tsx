import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import {
  MapView,
  AmbulanceMarker,
  HospitalMarker,
  JunctionMarker,
  PoliceMarker,
  IncidentMarker,
  RoutePolyline,
} from '../../../components/map';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';
import { SOSController } from '../components/SOSController';
import { ActiveEmergencyView } from '../components/ActiveEmergencyView';
import { IncidentReportModal } from '../../../components/common/IncidentReportModal';
import { HospitalSearchPanel } from '../components/HospitalSearchPanel';
import { ambulanceService } from '../../../services/ambulanceService';
import { realtimeService } from '../../../services/realtimeService';
import { mockPoliceUnits, type Ambulance } from '../../../mock';
import type {
  Emergency,
  EmergencyCategory,
  EmergencyPriority,
  Junction,
  TrafficIncident,
  Hospital,
} from '../../../types';
import { useLocation } from '../../../hooks/useLocation';
import {
  searchNearbyHospitals,
  type LiveHospital,
} from '../../../services/hospitalSearchService';

/** Radius cap — only hospitals within 15 km */
const RADIUS_M = 15_000;

/** Convert a LiveHospital (from OSM) to the app's Hospital type */
function liveToHospital(h: LiveHospital): Hospital {
  return {
    id: h.id,
    name: h.name,
    address: h.address || h.name,
    location: { latitude: h.lat, longitude: h.lng },
    phone: h.phone || '',
    emergencyCapable: true,
    totalBeds: 0,
    availableIcuBeds: 0,
    traumaBaysAvailable: 0,
    doctorsOnDuty: 0,
    distanceKm: parseFloat((h.distanceMeters / 1000).toFixed(1)),
  };
}

export function AmbulanceDashboard() {
  const [ambulance, setAmbulance] = useState<Ambulance | null>(null);

  // Live OSM hospitals near the driver — loaded from Overpass API
  const [liveHospitals, setLiveHospitals] = useState<LiveHospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospitalsLoaded, setHospitalsLoaded] = useState(false);

  // The currently selected hospital (always a Hospital object, never just an ID)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const [category, setCategory] = useState<EmergencyCategory>('CARDIAC');
  const [priority, setPriority] = useState<EmergencyPriority>('CODE_RED');
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  const { gpsState, location: realLocation } = useLocation();
  const { addToast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  // ── Current GPS position ───────────────────────────────────────────────────
  const currentPos: [number, number] = useMemo(
    () =>
      realLocation
        ? [realLocation.latitude, realLocation.longitude]
        : ambulance?.position ?? [12.9716, 77.5946],
    [realLocation, ambulance?.position],
  );
  const currentAccuracy = realLocation?.accuracy || ambulance?.accuracy || 5;

  // ── Load real nearby hospitals from OSM Overpass when GPS is ready ─────────
  useEffect(() => {
    if (!realLocation || hospitalsLoaded) return;

    const pos: [number, number] = [realLocation.latitude, realLocation.longitude];
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoadingHospitals(true);

    searchNearbyHospitals(pos, RADIUS_M, abortRef.current.signal)
      .then(results => {
        setLiveHospitals(results);
        setHospitalsLoaded(true);
        setLoadingHospitals(false);

        if (results.length > 0) {
          const nearest = results[0]; // already sorted nearest-first
          const hosp = liveToHospital(nearest);
          setSelectedHospital(hosp);
          addToast({
            variant: 'success',
            title: '📍 Nearest Hospital Auto-Selected',
            message: `${nearest.name} — ${nearest.distanceLabel}`,
          });
        } else {
          addToast({
            variant: 'warning',
            title: 'No hospitals found',
            message: `No hospitals within ${RADIUS_M / 1000} km. Use the map search to find one.`,
          });
        }
      })
      .catch(() => {
        setLoadingHospitals(false);
      });
  }, [realLocation?.latitude, realLocation?.longitude, hospitalsLoaded, addToast]);

  // ── App data init ──────────────────────────────────────────────────────────
  useEffect(() => {
    ambulanceService.getAmbulanceState('AMB-001').then(setAmbulance);
    setJunctions(realtimeService.getJunctions());
    setIncidents(realtimeService.getIncidents());

    const active = realtimeService.getActiveEmergency();
    if (active && (active.status === 'ACTIVE' || active.status === 'ACCEPTED')) {
      setActiveEmergency(active);
      setSelectedHospital(active.hospital);
    }

    const unsubJunctions = realtimeService.on('junctions_updated', (u: Junction[]) => setJunctions(u));
    const unsubIncidents = realtimeService.on('incidents_updated', (u: TrafficIncident[]) => setIncidents(u));
    const unsubEmergency = realtimeService.on('emergency_status', (emg: Emergency) => {
      if (emg && (emg.status === 'ACTIVE' || emg.status === 'ACCEPTED')) {
        setActiveEmergency(emg);
        setSelectedHospital(emg.hospital);
      } else {
        setActiveEmergency(null);
      }
    });

    return () => { unsubJunctions(); unsubIncidents(); unsubEmergency(); };
  }, []);

  // ── Broadcast live GPS continuously ───────────────────────────────────────
  useEffect(() => {
    if (!realLocation || !ambulance) return;
    const realPos: [number, number] = [realLocation.latitude, realLocation.longitude];
    const liveSpeed = realLocation.speed ?? (activeEmergency ? 52 : 0);
    const heading = realLocation.heading || ambulance.heading || 0;

    setAmbulance(prev =>
      prev ? { ...prev, position: realPos, speedKmH: liveSpeed, heading, accuracy: realLocation.accuracy } : prev,
    );

    realtimeService.broadcastAmbulanceLocation({
      ambulanceId: ambulance.id,
      position: realPos,
      heading,
      speedKmH: liveSpeed,
    });
  }, [realLocation, ambulance?.id, activeEmergency]);

  // ── Hospital search panel callback ─────────────────────────────────────────
  const handleSearchSelect = useCallback((h: LiveHospital) => {
    const hosp = liveToHospital(h);
    setSelectedHospital(hosp);
    addToast({
      variant: 'info',
      title: '🏥 Hospital Selected',
      message: `${h.name} — ${h.distanceLabel}`,
    });
  }, [addToast]);

  // ── Dropdown change (from live hospitals list) ─────────────────────────────
  const handleDropdownChange = (hospitalId: string) => {
    const found = liveHospitals.find(h => h.id === hospitalId);
    if (found) setSelectedHospital(liveToHospital(found));
  };

  const handleCancelEmergency = useCallback(() => {
    if (!activeEmergency) return;
    ambulanceService.cancelSOS(activeEmergency.id).then(() => {
      setActiveEmergency(null);
      addToast({ variant: 'info', title: 'Emergency Cancelled', message: 'The trip was aborted.' });
    });
  }, [activeEmergency, addToast]);

  const handleCompleteEmergency = useCallback(() => {
    if (!activeEmergency) return;
    ambulanceService.completeSOS(activeEmergency.id).then(() => {
      setActiveEmergency(null);
      addToast({ variant: 'success', title: 'Mission Completed', message: 'Patient delivered to ER.' });
    });
  }, [activeEmergency, addToast]);

  if (!ambulance) {
    return (
      <div className="min-h-dvh bg-navy-950 flex flex-col items-center justify-center gap-3 text-navy-400">
        <svg className="animate-spin w-6 h-6 text-primary-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Connecting to AERO Telemetry…</span>
      </div>
    );
  }

  const destinationPos: [number, number] | null = selectedHospital
    ? [selectedHospital.location.latitude, selectedHospital.location.longitude]
    : null;

  // Hospital dropdown — live OSM results only, sorted nearest first
  const hospitalDropdownOptions = liveHospitals.map((h, idx) => ({
    value: h.id,
    label: `${idx === 0 ? '★ ' : ''}${h.name} — ${h.distanceLabel}`,
  }));

  return (
    <AppShell
      userRole="AMBULANCE"
      userName={`${ambulance.name} (${ambulance.vehicleNumber})`}
      connectionState={ambulance.connectionState}
      gpsState={gpsState}
      gpsAccuracy={currentAccuracy}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* ── Map ── */}
        <div className="flex-1 relative min-h-0 bg-gray-100">
          <MapView center={currentPos} zoom={15} showLiveLocation={true}>
            {/* Hospital search — renders inside map for flyTo support */}
            <HospitalSearchPanel
              userPos={realLocation ? [realLocation.latitude, realLocation.longitude] : null}
              onSelect={handleSearchSelect}
              selectedHospitalId={selectedHospital?.id}
              radiusMeters={RADIUS_M}
            />

            {/* Ambulance */}
            <AmbulanceMarker
              position={currentPos}
              heading={ambulance.heading}
              label={ambulance.name}
              speedKmH={ambulance.speedKmH}
              vehicleNumber={ambulance.vehicleNumber}
              isSOS={!!activeEmergency}
            />

            {/* Selected hospital pin */}
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

            {/* Active emergency route */}
            {activeEmergency && (
              <RoutePolyline
                positions={activeEmergency.route?.polyline || []}
                congestionSegments={activeEmergency.route?.congestionSegments}
                active={activeEmergency.status === 'ACTIVE'}
              />
            )}

            {/* Police junctions */}
            {junctions.map(j => (
              <JunctionMarker
                key={j.id}
                position={[j.location.latitude, j.location.longitude]}
                name={j.name}
                status={j.status}
                distanceMeters={j.distanceFromAmbulanceMeters}
                policeName={j.assignedPoliceName}
              />
            ))}

            {/* Police units */}
            {mockPoliceUnits.map(p => (
              <PoliceMarker
                key={p.id}
                position={p.position}
                name={p.name}
                station={p.station}
                badgeNumber={p.badgeNumber}
                availability={p.availability}
              />
            ))}

            {/* Incidents */}
            {incidents.map(inc => (
              <IncidentMarker
                key={inc.id}
                position={[inc.location.latitude, inc.location.longitude]}
                title={inc.title}
                description={inc.description}
                type={inc.type}
                severity={inc.severity}
                reportedBy={inc.reportedBy}
              />
            ))}
          </MapView>

          {/* GPS telemetry overlay */}
          <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap justify-between items-start gap-2 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-1.5 shadow-md text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-mono text-gray-800 font-bold hidden sm:inline">
                {currentPos[0].toFixed(5)}, {currentPos[1].toFixed(5)}
              </span>
              <span className="font-mono text-gray-700 font-bold sm:hidden">
                {currentPos[0].toFixed(3)}, {currentPos[1].toFixed(3)}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 font-mono">±{currentAccuracy}m</span>
              <span className="text-gray-300">|</span>
              <span className="text-emerald-600 font-bold font-mono">{ambulance.speedKmH || 0} km/h</span>
            </div>

            <div className="pointer-events-auto flex flex-col items-end gap-1.5">
              {/* Nearest hospital badge */}
              {selectedHospital && !activeEmergency && (
                <div className="flex items-center gap-1.5 bg-emerald-600/90 backdrop-blur text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                  <span>🏥</span>
                  <span className="truncate max-w-[150px]">{selectedHospital.name.split(' ')[0]}</span>
                  {selectedHospital.distanceKm ? (
                    <span className="text-emerald-200">— {selectedHospital.distanceKm} km</span>
                  ) : null}
                </div>
              )}
              {loadingHospitals && (
                <div className="flex items-center gap-1.5 bg-blue-600/90 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Loading hospitals…</span>
                </div>
              )}
              <button
                onClick={() => setShowIncidentModal(true)}
                className="bg-white/95 backdrop-blur border border-orange-400/80 hover:bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                ⚠️ Hazard
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom panel ── */}
        <div className="bg-navy-900 border-t border-navy-700/80 p-4 shrink-0 shadow-lg relative z-[500]">
          {!activeEmergency ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="md:col-span-2 space-y-2">
                  {/* Hospital selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-navy-400 uppercase tracking-wider">
                        Destination Hospital
                        {liveHospitals.length > 0 && (
                          <span className="ml-2 text-emerald-400 normal-case font-normal">
                            ({liveHospitals.length} within 15 km)
                          </span>
                        )}
                      </label>
                      <span className="text-[10px] text-blue-400 font-mono">📡 Live OSM Data</span>
                    </div>

                    {liveHospitals.length > 0 ? (
                      <Select
                        options={hospitalDropdownOptions}
                        value={selectedHospital?.id || ''}
                        onChange={e => handleDropdownChange(e.target.value)}
                        placeholder="Select a nearby hospital…"
                      />
                    ) : loadingHospitals ? (
                      <div className="flex items-center gap-2 bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-xs text-navy-400">
                        <svg className="animate-spin w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Searching for hospitals near your location…
                      </div>
                    ) : (
                      <div className="bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-xs text-navy-400 flex items-center justify-between">
                        <span>
                          {!realLocation
                            ? '📍 Waiting for GPS… Allow location access.'
                            : '🔍 No hospitals found — use map search above'}
                        </span>
                        {hospitalsLoaded && (
                          <button
                            onClick={() => { setHospitalsLoaded(false); }}
                            className="text-blue-400 hover:text-blue-300 underline cursor-pointer ml-2"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* If a hospital was manually picked via map search */}
                  {selectedHospital && !liveHospitals.find(h => h.id === selectedHospital.id) && (
                    <div className="flex items-center justify-between bg-emerald-900/40 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs">
                      <div>
                        <p className="text-emerald-300 font-bold">{selectedHospital.name}</p>
                        <p className="text-navy-400 mt-0.5">
                          {selectedHospital.distanceKm ? `${selectedHospital.distanceKm} km · ` : ''}
                          Selected from map search
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedHospital(liveHospitals.length > 0 ? liveToHospital(liveHospitals[0]) : null)}
                        className="text-navy-400 hover:text-navy-200 cursor-pointer text-[10px] underline ml-3"
                      >
                        Reset
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
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
                      options={[
                        { value: 'CODE_RED', label: '🔴 Code Red — Immediate' },
                        { value: 'CODE_AMBER', label: '🟠 Code Amber — Urgent' },
                        { value: 'CODE_YELLOW', label: '🟡 Code Yellow — Moderate' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  {selectedHospital ? (
                    <SOSController
                      hospital={selectedHospital}
                      ambulanceId={ambulance.id}
                      currentPos={currentPos}
                      patientData={{
                        category,
                        priority,
                        chiefComplaint: `${category} — ${priority}`,
                      }}
                      onEmergencyActive={setActiveEmergency}
                    />
                  ) : (
                    <div className="w-full py-4 rounded-2xl bg-navy-800 border border-navy-700 text-center text-navy-500 text-xs font-medium">
                      Select a hospital to enable SOS
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <ActiveEmergencyView
                emergency={activeEmergency}
                hospitalName={selectedHospital?.name || activeEmergency.hospital.name}
                onCancel={handleCancelEmergency}
                onComplete={handleCompleteEmergency}
                onReroute={() => {
                  const updated = realtimeService.getActiveEmergency();
                  if (updated) setActiveEmergency(updated);
                }}
                currentSpeedKmH={ambulance.speedKmH}
              />
            </div>
          )}
        </div>
      </div>

      <IncidentReportModal
        open={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        reporterName={`${ambulance.name} (${ambulance.vehicleNumber})`}
        defaultPosition={currentPos}
      />
    </AppShell>
  );
}
