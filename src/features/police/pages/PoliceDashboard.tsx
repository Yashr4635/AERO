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

import { useToast } from '../../../components/ui/Toast';
import { IncomingEmergencyAlert } from '../components/IncomingEmergencyAlert';
import { realtimeService } from '../../../services/realtimeService';
import type { EmergencyIncident } from '../../../types';
import { useLocation } from '../../../hooks/useLocation';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export function PoliceDashboard() {
  const { addToast } = useToast();
  
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const { gpsState, location: officerLocation } = useLocation();
  const [policeProfile, setPoliceProfile] = useState<any>(null);

  useEffect(() => {
    // Fetch officer profile
    const fetchProfile = async () => {
      try {
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
          // DEMO MODE: Provide a mock profile instead of kicking the user out
          setPoliceProfile({ id: 'demo-police-id', full_name: 'Traffic Control (Demo)' });
        }
      } catch (err) {
        console.warn("Supabase auth bypassed for Demo Mode.");
        setPoliceProfile({ id: 'demo-police-id', full_name: 'Traffic Control (Demo)' });
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
    return <div className="min-h-dvh bg-bg-main flex items-center justify-center text-text-secondary">Loading Police Terminal...</div>;
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
        <div className="flex-1 flex flex-col min-h-0 border-r border-border-subtle">
          
          {/* Incoming Emergency Alerts Bar */}
          <AnimatePresence>
            {incoming.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="shrink-0 p-3 bg-bg-surface border-b border-border-subtle z-[10] space-y-2 shadow-sm"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Police Map Area */}
          <div className="flex-1 relative min-h-[300px] bg-bg-main">
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
        <div className="w-full lg:w-[450px] shrink-0 bg-bg-main flex flex-col h-full overflow-y-auto">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-bg-surface shadow-sm z-10">
            <h2 className="text-sm font-bold tracking-wider text-white">ACTIVE CORRIDORS</h2>
            <div className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#35C7FF]/10 text-[#35C7FF]">
              {active.length} ACTIVE
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1">
            <AnimatePresence mode="wait">
              {active.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-text-secondary py-12"
                >
                  <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mx-auto mb-3 border border-border-subtle shadow-inner">
                    <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <p className="font-medium text-white">No active emergencies.</p>
                  <p className="text-sm">Standby for incoming requests.</p>
                </motion.div>
              ) : (
                active.map((incident, index) => (
                  <motion.div
                    key={incident.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="enterprise-card border-[#35C7FF]/30">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-white text-lg">{incident.ambulance_id || 'Ambulance'}</h3>
                          <p className="text-xs text-[#FF3B30] font-bold bg-[#FF3B30]/10 inline-block px-2 py-0.5 rounded-full mt-1 border border-[#FF3B30]/20">
                            {incident.priority.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#35C7FF] font-mono">
                            {Math.round((incident.route_duration_seconds || 0) / 60)}<span className="text-sm text-[#35C7FF]/70 ml-1">min</span>
                          </div>
                          <p className="telemetry-label mt-0.5">ETA</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm bg-bg-main rounded-lg p-3 border border-border-subtle">
                        <div className="flex justify-between items-center">
                          <span className="telemetry-label">Destination</span>
                          <span className="text-white font-medium">{incident.destination_hospital}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="telemetry-label">Distance</span>
                          <span className="text-[#20D67A] font-mono font-medium">{((incident.route_distance_meters || 0) / 1000).toFixed(1)} km</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="telemetry-label">Speed</span>
                          <span className="text-[#35C7FF] font-mono font-medium">{Math.round(incident.current_speed || 0)} km/h</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="telemetry-label">Corridor Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            className="bg-[#20D67A]/10 hover:bg-[#20D67A]/20 text-[#20D67A] border border-[#20D67A]/30 font-bold py-2 rounded-lg text-xs transition-colors"
                            onClick={() => handleStatusChange(incident.id, 'CLEAR')}
                          >
                            CLEAR
                          </button>
                          <button 
                            className="bg-[#35C7FF]/10 hover:bg-[#35C7FF]/20 text-[#35C7FF] border border-[#35C7FF]/30 font-bold py-2 rounded-lg text-xs transition-colors"
                            onClick={() => handleStatusChange(incident.id, 'CLEARING')}
                          >
                            CLEARING
                          </button>
                          <button 
                            className="bg-[#FFB020]/10 hover:bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/30 font-bold py-2 rounded-lg text-xs transition-colors"
                            onClick={() => handleStatusChange(incident.id, 'CAUTION')}
                          >
                            CAUTION
                          </button>
                          <button 
                            className="bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/30 font-bold py-2 rounded-lg text-xs transition-colors"
                            onClick={() => handleStatusChange(incident.id, 'BLOCKED')}
                          >
                            BLOCKED
                          </button>
                        </div>
                        <p className="text-[11px] text-center text-text-secondary mt-2">
                          Current Status: <strong className="text-white">{incident.corridor_status}</strong>
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
