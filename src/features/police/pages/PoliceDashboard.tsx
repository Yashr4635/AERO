import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { AvailabilityToggle } from '../../../components/status/AvailabilityToggle';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { IncomingEmergencyAlert } from '../components/IncomingEmergencyAlert';
import { IncidentReportModal } from '../../../components/common/IncidentReportModal';
import { policeService } from '../../../services/policeService';
import { realtimeService } from '../../../services/realtimeService';
import { mockAmbulances, type PoliceUnit } from '../../../mock';
import type {
  Emergency,
  Junction,
  JunctionStatus,
  TrafficIncident,
  PoliceCoordinationMessage,
} from '../../../types';
import { useLocation } from '../../../hooks/useLocation';

export function PoliceDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [police, setPolice] = useState<PoliceUnit | null>(null);
  const [incoming, setIncoming] = useState<Emergency[]>([]);
  const [active, setActive] = useState<Emergency[]>([]);
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [coordinationMessages, setCoordinationMessages] = useState<PoliceCoordinationMessage[]>([]);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [handoverNote, setHandoverNote] = useState('');
  const [selectedJunctionForHandover, setSelectedJunctionForHandover] = useState('JUNC-102');

  // Live tracking for active ambulance
  const [liveAmbulancePos, setLiveAmbulancePos] = useState<[number, number] | null>(null);
  const [liveAmbulanceHeading, setLiveAmbulanceHeading] = useState<number>(0);
  const [liveAmbulanceSpeed, setLiveAmbulanceSpeed] = useState<number>(0);

  const { gpsState, location: officerLocation } = useLocation();

  useEffect(() => {
    policeService.getPoliceState('POL-001').then(setPolice);
    setJunctions(realtimeService.getJunctions());
    setIncidents(realtimeService.getIncidents());
    setCoordinationMessages(realtimeService.getCoordinationMessages());

    const refreshData = () => {
      const all = realtimeService.getAllEmergencies();
      const activeEmg = realtimeService.getActiveEmergency();

      const incomingList = all.filter(e => e.status === 'PENDING');
      const activeList = activeEmg && (activeEmg.status === 'ACTIVE' || activeEmg.status === 'ACCEPTED')
        ? [activeEmg]
        : all.filter(e => e.status === 'ACTIVE' || e.status === 'ACCEPTED');

      setIncoming(incomingList);
      setActive(activeList);

      if (activeList.length > 0 && activeList[0].route?.polyline && activeList[0].route.polyline.length > 0) {
        setLiveAmbulancePos(activeList[0].route.polyline[0]);
      }
    };

    refreshData();

    const unsubEmergency = realtimeService.on('police_alert', (emg: Emergency) => {
      refreshData();
      if (emg && (emg.status === 'ACTIVE' || emg.status === 'ACCEPTED' || emg.status === 'PENDING')) {
        addToast({
          variant: 'error',
          title: '🚨 INCOMING EMERGENCY CORRIDOR',
          message: `Ambulance requesting urgent priority clearance to ${emg.hospital?.name || 'Hospital'}.`,
        });
      }
    });

    const unsubLocation = realtimeService.on('ambulance_location', (data: { position: [number, number]; heading: number; speedKmH: number; etaSeconds?: number; distanceRemainingMeters?: number }) => {
      setLiveAmbulancePos(data.position);
      setLiveAmbulanceHeading(data.heading);
      setLiveAmbulanceSpeed(data.speedKmH);

      setActive(prev => prev.map(emg => ({
        ...emg,
        currentSpeedKmH: data.speedKmH,
        route: emg.route ? {
          ...emg.route,
          distanceMeters: data.distanceRemainingMeters ?? emg.route.distanceMeters,
          etaSeconds: data.etaSeconds ?? emg.route.etaSeconds,
        } : undefined,
      })));
    });

    const unsubJunctions = realtimeService.on('junctions_updated', (updatedJunctions: Junction[]) => {
      setJunctions(updatedJunctions);
    });

    const unsubIncidents = realtimeService.on('incidents_updated', (updatedIncidents: TrafficIncident[]) => {
      setIncidents(updatedIncidents);
    });

    const unsubMessages = realtimeService.on('police_message', () => {
      setCoordinationMessages(realtimeService.getCoordinationMessages());
    });

    return () => {
      unsubEmergency();
      unsubLocation();
      unsubJunctions();
      unsubIncidents();
      unsubMessages();
    };
  }, [addToast]);

  const handleAvailabilityChange = (status: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE') => {
    if (!police) return;
    policeService.setAvailability(police.id, status).then(res => {
      setPolice({ ...police, availability: res.status });
      addToast({ variant: 'info', title: 'Duty Status Updated', message: `Officer status set to ${res.status}.` });
    });
  };

  const handleAccept = (emergencyId: string) => {
    if (!police) return;
    policeService.acceptEmergency(emergencyId, police.id).then(() => {
      addToast({
        variant: 'success',
        title: 'Emergency Accepted',
        message: 'You are actively coordinating the green-wave corridor for this ambulance.',
      });
      handleAvailabilityChange('BUSY');
      setIncoming(prev => prev.filter(e => e.id !== emergencyId));
      policeService.getActiveEmergencies().then(setActive);
    });
  };

  const handleJunctionStatusChange = async (junctionId: string, status: JunctionStatus) => {
    await policeService.updateJunctionStatus(junctionId, status);
    const jName = junctions.find(j => j.id === junctionId)?.name || 'Junction';
    addToast({
      variant: 'success',
      title: 'Traffic Clearance Updated',
      message: `${jName} marked as ${status}. Broadcasted to Ambulance.`,
    });
  };

  const handleSendCoordination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNote.trim() || !police) return;
    const activeId = active[0]?.id || 'EMG-1001';
    await policeService.sendCoordinationMessage(
      activeId,
      police.id,
      selectedJunctionForHandover,
      handoverNote
    );
    addToast({
      variant: 'success',
      title: 'Coordination Dispatched',
      message: 'Notice transmitted to forward junction officers.',
    });
    setHandoverNote('');
  };

  if (!police) {
    return <div className="min-h-dvh bg-navy-950 flex items-center justify-center text-navy-400">Loading Police Terminal...</div>;
  }

  const primaryActiveEmergency = active[0];
  const primaryAmbulance = primaryActiveEmergency
    ? mockAmbulances.find(a => a.id === primaryActiveEmergency.ambulanceId) || mockAmbulances[0]
    : mockAmbulances[0];

  const officerPos: [number, number] = officerLocation
    ? [officerLocation.latitude, officerLocation.longitude]
    : police.position;

  const mapCenter: [number, number] = liveAmbulancePos || officerPos;

  return (
    <AppShell 
      userRole="POLICE" 
      userName={`${police.name} (${police.badgeNumber})`} 
      connectionState={police.connectionState}
      gpsState={gpsState}
      gpsAccuracy={officerLocation?.accuracy || 6}
    >
      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        
        {/* Left Side: Live Traffic Coordination Map & Incoming Alerts */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-navy-800">
          
          {/* Incoming Emergency Alerts Bar */}
          {incoming.length > 0 && (
            <div className="shrink-0 p-3 bg-navy-950 border-b border-navy-800 z-[10] space-y-2">
              {incoming.map(emergency => {
                const hospital = emergency.hospital;
                const ambulance = mockAmbulances.find(a => a.id === emergency.ambulanceId);
                return (
                  <IncomingEmergencyAlert
                    key={emergency.id}
                    emergency={emergency}
                    hospitalName={hospital?.name || 'Hospital'}
                    ambulanceName={ambulance?.name || 'Emergency Unit'}
                    onAccept={handleAccept}
                    onViewDetails={(id) => navigate(`/police/emergency/${id}`)}
                  />
                );
              })}
            </div>
          )}

          {/* Live Police Map Area (White Theme) */}
          <div className="flex-1 relative min-h-[300px] bg-gray-100">
            <MapView center={mapCenter} zoom={14} showLiveLocation={true}>
              {/* Police Officer Post */}
              <PoliceMarker
                position={officerPos}
                name={police.name}
                station={police.station}
                badgeNumber={police.badgeNumber}
                availability={police.availability}
              />

              {/* Active Ambulances */}
              {active.map(emergency => {
                const amb = mockAmbulances.find(a => a.id === emergency.ambulanceId) || primaryAmbulance;
                const pos = liveAmbulancePos || amb.position;
                return (
                  <div key={emergency.id}>
                    <AmbulanceMarker
                      position={pos}
                      heading={liveAmbulanceHeading || amb.heading}
                      label={amb.name}
                      speedKmH={liveAmbulanceSpeed || emergency.currentSpeedKmH || 54}
                      vehicleNumber={amb.vehicleNumber}
                      isSOS
                    />
                    <HospitalMarker
                      position={[emergency.hospital.location.latitude, emergency.hospital.location.longitude]}
                      name={emergency.hospital.name}
                    />
                    <RoutePolyline
                      positions={emergency.route?.polyline || []}
                      congestionSegments={emergency.route?.congestionSegments}
                      active
                    />
                  </div>
                );
              })}

              {/* Checkpoint Junctions */}
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

              {/* Incidents / Hazards */}
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

            {/* Top Right Availability & Incident Action Overlay */}
            <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
              <button
                onClick={() => setShowIncidentModal(true)}
                className="bg-white/95 backdrop-blur border border-orange-400/80 hover:bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                ⚠️ Report Hazard
              </button>
              <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-1.5 shadow-md">
                <AvailabilityToggle status={police.availability} onChange={handleAvailabilityChange} />
              </div>
            </div>

            {/* Approaching Ambulance Proximity Pill */}
            {primaryActiveEmergency && (
              <div className="absolute top-3 left-3 z-[400] bg-navy-900/95 backdrop-blur border border-emergency-500/60 rounded-xl p-3 shadow-modal text-xs flex items-center gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-lg bg-emergency-600/30 flex items-center justify-center text-lg">
                  🚨
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emergency-400 uppercase tracking-wide">APPROACHING AMBULANCE (LIVE)</span>
                    <span className="w-2 h-2 rounded-full bg-emergency-500 animate-ping" />
                  </div>
                  <p className="text-navy-200 mt-0.5">
                    ETA: <strong className="text-white font-mono">{Math.round((primaryActiveEmergency.route?.etaSeconds || 240) / 60)} mins</strong> • Dist: <strong className="text-white font-mono">{primaryActiveEmergency.route?.distanceMeters || 2100}m</strong> • Speed: <strong className="text-emerald-400 font-mono">{liveAmbulanceSpeed || primaryActiveEmergency.currentSpeedKmH || 54} km/h</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Right Side: Junction Clearance Controls & Officer Handover Coordination */}
        <div className="w-full lg:w-[420px] bg-navy-900 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          
          {/* Junction Clearance Command Center */}
          <Card variant="default">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-navy-700">
              <div>
                <h3 className="text-sm font-bold text-navy-50 uppercase tracking-wider">
                  Junction Clearance Controls
                </h3>
                <p className="text-[11px] text-navy-400">Police-Assisted Green Wave Coordination</p>
              </div>
              <span className="text-xs bg-emerald-950 border border-emerald-700/60 text-emerald-300 px-2 py-0.5 rounded font-mono">
                {junctions.filter(j => j.status === 'CLEARED').length}/{junctions.length} Cleared
              </span>
            </div>

            <div className="space-y-3">
              {junctions.map(junction => {
                return (
                  <div
                    key={junction.id}
                    className="bg-navy-950 p-3 rounded-xl border border-navy-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-navy-100">{junction.name}</p>
                        <p className="text-[11px] text-navy-400">
                          {junction.assignedPoliceName ? `Officer: ${junction.assignedPoliceName}` : 'Automated Checkpoint'} • ETA: {junction.etaSeconds || 90}s
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          junction.status === 'CLEARED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : junction.status === 'PREPARING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : junction.status === 'PASSED'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800'
                            : 'bg-navy-800 text-navy-400'
                        }`}
                      >
                        {junction.status}
                      </span>
                    </div>

                    {/* Clearance Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <Button
                        variant={junction.status === 'PREPARING' ? 'primary' : 'outline'}
                        size="sm"
                        className="text-[11px] py-1 px-1"
                        onClick={() => handleJunctionStatusChange(junction.id, 'PREPARING')}
                      >
                        🟡 PREPARING
                      </Button>
                      <Button
                        variant={junction.status === 'CLEARED' ? 'success' : 'outline'}
                        size="sm"
                        className="text-[11px] py-1 px-1 font-bold"
                        onClick={() => handleJunctionStatusChange(junction.id, 'CLEARED')}
                      >
                        🟢 CLEARED
                      </Button>
                      <Button
                        variant={junction.status === 'PASSED' ? 'ghost' : 'outline'}
                        size="sm"
                        className="text-[11px] py-1 px-1 text-sky-300"
                        onClick={() => handleJunctionStatusChange(junction.id, 'PASSED')}
                      >
                        🔵 PASSED
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Next Officer Handover & Coordination Widget */}
          <Card variant="default">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-navy-700">
              <h3 className="text-sm font-bold text-navy-50 uppercase tracking-wider">
                Officer Handover Dispatch
              </h3>
              <span className="text-[11px] text-navy-400">Inter-Station Link</span>
            </div>

            <form onSubmit={handleSendCoordination} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-navy-300 mb-1">Target Forward Junction</label>
                <select
                  value={selectedJunctionForHandover}
                  onChange={(e) => setSelectedJunctionForHandover(e.target.value)}
                  className="w-full h-8 px-2 bg-navy-950 border border-navy-700 rounded-lg text-xs text-navy-100 outline-none"
                >
                  {junctions.map(j => (
                    <option key={j.id} value={j.id}>{j.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-navy-300 mb-1">Handover Instructions / Traffic Note</label>
                <input
                  type="text"
                  placeholder="e.g. Hold traffic from Richmond Rd for 90s, clear lane 2..."
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  className="w-full h-9 px-3 bg-navy-950 border border-navy-700 rounded-lg text-xs text-navy-100 outline-none placeholder-navy-500"
                />
              </div>

              <Button type="submit" variant="primary" size="sm" fullWidth>
                TRANSMIT HANDOVER DISPATCH
              </Button>
            </form>

            {/* Coordination Log */}
            {coordinationMessages.length > 0 && (
              <div className="mt-3 pt-3 border-t border-navy-800 space-y-2">
                <span className="text-[10px] text-navy-400 uppercase font-bold block">Recent Dispatches</span>
                {coordinationMessages.slice(0, 3).map(msg => (
                  <div key={msg.id} className="bg-navy-950 p-2 rounded-lg border border-navy-800 text-[11px]">
                    <div className="flex justify-between text-navy-400 text-[10px]">
                      <span>{msg.fromOfficerName} → {msg.toJunctionName}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="text-navy-200 mt-1 font-medium">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>

      <IncidentReportModal
        open={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        reporterName={`${police.name} (${police.station})`}
        defaultPosition={police.position}
      />
    </AppShell>
  );
}
