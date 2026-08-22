import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import {
  MapView,
  AmbulanceMarker,
  HospitalMarker,
  JunctionMarker,
  RoutePolyline,
} from '../../../components/map';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { ETADisplay } from '../../../components/status/ETADisplay';
import { EmergencyStatusBar } from '../../../components/status/EmergencyStatusBar';
import { policeService } from '../../../services/policeService';
import { realtimeService } from '../../../services/realtimeService';
import { mockAmbulances } from '../../../mock';
import type { Emergency, Junction, JunctionStatus } from '../../../types';

export function ActiveEmergencyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [ambulancePos, setAmbulancePos] = useState<[number, number] | null>(null);
  const [ambulanceHeading, setAmbulanceHeading] = useState<number>(0);
  const [junctions, setJunctions] = useState<Junction[]>([]);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      policeService.getEmergencyDetails(id).then(res => {
        if (res) {
          setEmergency(res);
        } else {
          const fallback = realtimeService.getActiveEmergency();
          if (fallback) setEmergency(fallback);
        }
      });
    }
    setJunctions(realtimeService.getJunctions());

    const unsubJunctions = realtimeService.on('junctions_updated', (updatedJunctions: Junction[]) => {
      setJunctions(updatedJunctions);
    });

    const unsubLocation = realtimeService.on('ambulance_location', (data: { position?: [number, number]; heading?: number; speedKmH: number; etaSeconds?: number; distanceRemainingMeters?: number }) => {
      if (data.position) {
        setAmbulancePos(data.position);
      }
      if (data.heading !== undefined) {
        setAmbulanceHeading(data.heading);
      }
      setEmergency(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentSpeedKmH: data.speedKmH,
          route: prev.route ? {
            ...prev.route,
            etaSeconds: data.etaSeconds ?? prev.route.etaSeconds,
            distanceMeters: data.distanceRemainingMeters ?? prev.route.distanceMeters,
          } : undefined,
        };
      });
    });

    return () => {
      unsubJunctions();
      unsubLocation();
    };
  }, [id]);

  if (!emergency) {
    return <div className="min-h-dvh bg-navy-950 flex items-center justify-center text-navy-400">Loading emergency telemetry details...</div>;
  }

  const ambulance = mockAmbulances.find(a => a.id === emergency.ambulanceId) || mockAmbulances[0];
  const hospital = emergency.hospital;

  const handleAccept = () => {
    policeService.acceptEmergency(emergency.id, 'POL-001').then(() => {
      setEmergency({ ...emergency, status: 'ACCEPTED' });
      addToast({ variant: 'success', title: 'Emergency Accepted', message: 'You have taken charge of the corridor.' });
    });
  };

  const handleMarkActive = () => {
    policeService.markActive(emergency.id).then(() => {
      setEmergency({ ...emergency, status: 'ACTIVE' });
      addToast({ variant: 'info', title: 'Corridor Active', message: 'Ambulance is actively running green wave.' });
    });
  };

  const handleComplete = () => {
    policeService.completeEmergency(emergency.id).then(() => {
      setShowCompleteDialog(false);
      addToast({ variant: 'success', title: 'Emergency Completed', message: 'Traffic flow returned to normal.' });
      navigate('/police');
    });
  };

  const handleJunctionClearance = (jId: string, status: JunctionStatus) => {
    policeService.updateJunctionStatus(jId, status);
    addToast({ variant: 'success', title: 'Junction Updated', message: `Junction marked ${status}` });
  };

  const activePos: [number, number] = ambulancePos || ambulance.position || [hospital.location.latitude, hospital.location.longitude];
  const mapCenter: [number, number] = activePos;

  return (
    <AppShell userRole="POLICE" connectionState="connected">
      <div className="flex flex-col h-full bg-navy-950 overflow-hidden">
        
        {/* Header */}
        <div className="bg-navy-900 border-b border-navy-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/police')}
              className="p-1.5 rounded-lg bg-navy-800 text-navy-400 hover:text-navy-100 transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-navy-50">Corridor Dispatch {emergency.id}</h1>
                <Badge variant="emergency" size="sm">{emergency.priority || 'CODE_RED'}</Badge>
              </div>
              <p className="text-xs text-navy-400">{ambulance.name} → {hospital.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-navy-400 uppercase block">Vehicle Speed</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{emergency.currentSpeedKmH || 54} km/h</span>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative min-h-0 border-b border-navy-800">
          <MapView center={mapCenter} zoom={15} showLiveLocation={true}>
            <AmbulanceMarker
              position={activePos}
              heading={ambulanceHeading || ambulance.heading}
              label={ambulance.name}
              speedKmH={emergency.currentSpeedKmH || 54}
              vehicleNumber={emergency.vehicleNumber}
              isSOS
            />
            <HospitalMarker
              position={[hospital.location.latitude, hospital.location.longitude]}
              name={hospital.name}
              availableIcuBeds={hospital.availableIcuBeds}
            />
            <RoutePolyline
              positions={emergency.route?.polyline || []}
              congestionSegments={emergency.route?.congestionSegments}
              active={emergency.status === 'ACTIVE'}
            />
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
          </MapView>

          <div className="absolute top-3 left-3 z-[400]">
            <div className="bg-navy-900/95 backdrop-blur border border-navy-700 rounded-xl px-4 py-2.5 shadow-card">
              <ETADisplay
                etaSeconds={emergency.route?.etaSeconds || 310}
                distanceMeters={emergency.route?.distanceMeters || 3800}
                compact
              />
            </div>
          </div>
        </div>

        {/* Bottom Details & Command Panel */}
        <div className="bg-navy-900 p-4 shrink-0 space-y-3 max-h-[45vh] overflow-y-auto">
          <EmergencyStatusBar status={emergency.status} />

          {/* Quick Junction Checkpoints Strip */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-navy-400 uppercase tracking-wider block">
              Route Junctions Status
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {junctions.slice(0, 3).map(j => (
                <div key={j.id} className="bg-navy-950 p-2 rounded-lg border border-navy-800 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-navy-100 truncate">{j.name}</p>
                    <p className="text-[10px] text-navy-400">Dist: {j.distanceFromAmbulanceMeters || 850}m</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleJunctionClearance(j.id, 'CLEARED')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        j.status === 'CLEARED' ? 'bg-emerald-600 text-white' : 'bg-navy-800 text-navy-300 hover:bg-emerald-950 hover:text-emerald-300'
                      }`}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => handleJunctionClearance(j.id, 'PASSED')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        j.status === 'PASSED' ? 'bg-sky-600 text-white' : 'bg-navy-800 text-navy-300 hover:bg-sky-950 hover:text-sky-300'
                      }`}
                    >
                      Passed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons based on status */}
          <div className="flex gap-3 pt-2">
            {emergency.status === 'PENDING' && (
              <Button variant="emergency" size="lg" fullWidth onClick={handleAccept}>
                ACCEPT EMERGENCY CORRIDOR
              </Button>
            )}
            {emergency.status === 'ACCEPTED' && (
              <Button variant="primary" size="lg" fullWidth onClick={handleMarkActive}>
                MARK GREEN-WAVE ACTIVE
              </Button>
            )}
            {emergency.status === 'ACTIVE' && (
              <Button variant="success" size="lg" fullWidth onClick={() => setShowCompleteDialog(true)}>
                CONFIRM AMBULANCE PASSED & RESUME NORMAL TRAFFIC
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        onConfirm={handleComplete}
        title="Complete Emergency Clearance"
        description="Confirm that the emergency vehicle has cleared all sector junctions. Traffic signals and normal police patrol can resume."
        confirmLabel="Complete & Resume Traffic"
        cancelLabel="Cancel"
      />
    </AppShell>
  );
}
