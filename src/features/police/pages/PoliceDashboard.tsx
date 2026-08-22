import { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import {
  MapView,
  AmbulanceMarker,
  HospitalMarker,
  PoliceMarker,
  RoutePolyline,
} from '../../../components/map';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { IncomingEmergencyAlert } from '../components/IncomingEmergencyAlert';
import { realtimeService } from '../../../services/realtimeService';
import type { EmergencyIncident } from '../../../types';
import { useLocation } from '../../../hooks/useLocation';
import { supabase } from '../../../lib/supabase';

export function PoliceDashboard() {
  const { addToast } = useToast();
  
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const { gpsState, location: officerLocation } = useLocation();
  const [policeProfile, setPoliceProfile] = useState<any>(null);

  useEffect(() => {
    // Fetch officer profile
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error || !data) {
          console.error("Error fetching police profile:", error);
          setPoliceProfile({ id: user.id, full_name: user.email?.split('@')[0] || 'Officer' });
        } else {
          setPoliceProfile(data);
        }
      } else {
        // If no user, redirect to login or show error
        window.location.href = '/';
      }
    };
    fetchProfile();

    // Subscribe to incidents
    const unsub = realtimeService.on('incidents_updated', (updatedIncidents: EmergencyIncident[]) => {
      setIncidents(updatedIncidents);
    });

    return () => unsub();
  }, []);

  const incoming = incidents.filter(i => i.status === 'active' && !i.police_acknowledged_at);
  const active = incidents.filter(i => i.status === 'active' && i.police_acknowledged_at);

  const handleAccept = async (emergencyId: string) => {
    const { error } = await supabase.from('emergency_incidents').update({
      police_acknowledged_at: new Date().toISOString(),
      police_id: policeProfile?.id
    }).eq('id', emergencyId);

    if (!error) {
      addToast({
        variant: 'success',
        title: 'Emergency Accepted',
        message: 'You are now coordinating the emergency corridor.',
      });
    } else {
      addToast({ variant: 'error', title: 'Error', message: 'Could not accept emergency' });
    }
  };

  const handleStatusChange = async (emergencyId: string, status: string) => {
    const { error } = await supabase.from('emergency_incidents').update({
      corridor_status: status
    }).eq('id', emergencyId);

    if (!error) {
      addToast({
        variant: 'success',
        title: 'Corridor Updated',
        message: `Status updated to ${status}.`,
      });
    }
  };

  const officerPos: [number, number] = officerLocation
    ? [officerLocation.latitude, officerLocation.longitude || 78.34]
    : [17.44, 78.34]; // Fallback

  const primaryIncident = active[0] || incoming[0];
  const mapCenter: [number, number] = primaryIncident && primaryIncident.current_latitude 
    ? [primaryIncident.current_latitude, primaryIncident.current_longitude || 78.34] 
    : officerPos;

  if (!policeProfile) {
    return <div className="min-h-dvh bg-navy-950 flex items-center justify-center text-navy-400">Loading Police Terminal...</div>;
  }

  return (
    <AppShell 
      userRole="POLICE" 
      userName={`${policeProfile.full_name || 'Officer'}`} 
      connectionState={realtimeService.getConnectionState()}
      gpsState={gpsState}
      gpsAccuracy={officerLocation?.accuracy || 0}
    >
      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        
        {/* Left Side: Live Traffic Coordination Map & Incoming Alerts */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-navy-800">
          
          {/* Incoming Emergency Alerts Bar */}
          {incoming.length > 0 && (
            <div className="shrink-0 p-3 bg-navy-950 border-b border-navy-800 z-[10] space-y-2">
              {incoming.map(incident => (
                <IncomingEmergencyAlert
                  key={incident.id}
                  emergency={incident}
                  hospitalName={incident.destination_hospital}
                  ambulanceName={incident.ambulance_id || 'Ambulance'}
                  onAccept={handleAccept}
                  onViewDetails={() => {}}
                />
              ))}
            </div>
          )}

          {/* Live Police Map Area */}
          <div className="flex-1 relative min-h-[300px] bg-gray-100">
            <MapView center={mapCenter} zoom={14} showLiveLocation={true}>
              {/* Police Officer Post */}
              <PoliceMarker
                position={officerPos}
                name={policeProfile.full_name}
                station="HQ"
                badgeNumber="POL-001"
                availability="AVAILABLE"
              />

              {/* Active Ambulances */}
              {[...incoming, ...active].map(incident => {
                const pos: [number, number] = [incident.current_latitude || incident.latitude, incident.current_longitude || incident.longitude];
                const dest: [number, number] = [incident.destination_latitude, incident.destination_longitude];
                
                return (
                  <div key={incident.id}>
                    <AmbulanceMarker
                      position={pos}
                      heading={incident.current_heading || 0}
                      label={incident.ambulance_id || 'Ambulance'}
                      speedKmH={incident.current_speed || 0}
                      isSOS
                    />
                    <HospitalMarker
                      position={dest}
                      name={incident.destination_hospital}
                    />
                    {incident.route_geometry && (
                      <RoutePolyline positions={incident.route_geometry} active={true} />
                    )}
                  </div>
                );
              })}
            </MapView>
          </div>
        </div>

        {/* Right Side: Operations Panel */}
        <div className="w-full lg:w-[450px] shrink-0 bg-navy-950 flex flex-col h-full overflow-y-auto">
          <div className="p-4 border-b border-navy-800 flex justify-between items-center bg-navy-900/50">
            <h2 className="text-sm font-semibold tracking-wider text-navy-300">ACTIVE CORRIDORS</h2>
            <div className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
              {active.length} ACTIVE
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            {active.length === 0 ? (
              <div className="text-center text-navy-400 py-12">
                <div className="w-12 h-12 rounded-full bg-navy-900 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                </div>
                <p>No active emergencies.</p>
                <p className="text-sm">Standby for incoming requests.</p>
              </div>
            ) : (
              active.map(incident => (
                <Card key={incident.id} className="p-4 bg-navy-900/50 border-blue-500/30 ring-1 ring-blue-500/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">{incident.ambulance_id || 'Ambulance'}</h3>
                      <p className="text-sm text-red-400 font-medium">Priority: {incident.priority.toUpperCase()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-400 font-mono">
                        {Math.round((incident.route_duration_seconds || 0) / 60)}<span className="text-sm text-blue-500 ml-1">min</span>
                      </div>
                      <p className="text-xs text-navy-300">ETA</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm bg-navy-950 rounded-lg p-3 border border-navy-800">
                    <div className="flex justify-between">
                      <span className="text-navy-400">Destination:</span>
                      <span className="text-white font-medium">{incident.destination_hospital}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Distance:</span>
                      <span className="text-white font-medium">{((incident.route_distance_meters || 0) / 1000).toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy-400">Speed:</span>
                      <span className="text-white font-medium">{Math.round(incident.current_speed || 0)} km/h</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-navy-400 uppercase tracking-wider mb-2">Corridor Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="success" size="sm" onClick={() => handleStatusChange(incident.id, 'CLEAR')}>CLEAR</Button>
                      <Button variant="emergency" size="sm" onClick={() => handleStatusChange(incident.id, 'CLEARING')}>CLEARING</Button>
                      <Button variant="primary" size="sm" onClick={() => handleStatusChange(incident.id, 'CAUTION')}>CAUTION</Button>
                      <Button variant="danger" size="sm" onClick={() => handleStatusChange(incident.id, 'BLOCKED')}>BLOCKED</Button>
                    </div>
                    <p className="text-xs text-center text-navy-300 mt-2">Current Status: <strong>{incident.corridor_status}</strong></p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
