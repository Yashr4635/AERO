import { useState, useEffect } from 'react';
import { Ambulance, Building2 } from 'lucide-react';
import { AppShell } from '../../../components/layout/AppShell';
import { MapView, AmbulanceMarker, HospitalMarker, RoutePolyline } from '../../../components/map';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { hospitalService } from '../../../services/hospitalService';
import { realtimeService } from '../../../services/realtimeService';
import { mockAmbulances } from '../../../mock';
import type { Emergency, Hospital, HospitalPreparationState } from '../../../types';

export function HospitalDashboard() {
  const { addToast } = useToast();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [incomingEmergencies, setIncomingEmergencies] = useState<Emergency[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [prepState, setPrepState] = useState<HospitalPreparationState>({
    traumaBayReady: true,
    icuBedReserved: true,
    otStandby: false,
    bloodReady: false,
    specialistAlerted: true,
  });

  useEffect(() => {
    // Load hospital details
    hospitalService.getHospitalState('HOSP-002').then(setHospital);
    
    // Fallback if not loaded
    const hospName = hospital?.name || 'Bowring & Lady Curzon Hospital';

    const unsubscribeEmergency = realtimeService.on('incidents_updated', (incidents: any[]) => {
      // Filter for incidents where destination is this hospital
      const incoming = incidents.filter(i => 
        (i.status === 'active' || i.status === 'ACCEPTED') && 
        i.destination_hospital === hospName
      );
      
      // Map database format to Emergency format for UI (adapter)
      const mappedEmergencies = incoming.map(i => ({
        id: i.id,
        status: i.status === 'active' ? 'ACTIVE' : i.status,
        priority: i.priority,
        category: i.incident_type,
        ambulanceId: i.ambulance_id,
        ambulanceDisplayName: i.ambulance_id,
        vehicleNumber: i.ambulance_id,
        currentSpeedKmH: i.current_speed,
        route: {
          polyline: i.route_geometry,
          distanceMeters: i.route_distance_meters,
          etaSeconds: i.route_duration_seconds,
        },
        patient: {
          name: 'Emergency Patient',
          category: i.incident_type,
          chiefComplaint: i.description || 'Incoming Emergency',
          vitals: { heartRate: 114, bloodPressure: '150/90', spo2: 92, respiratoryRate: 22, gcsScore: 14 }
        },
        hospitalPrep: prepState
      }));

      setIncomingEmergencies(mappedEmergencies as any);

      if (mappedEmergencies.length > 0) {
        if (!selectedEmergency || !mappedEmergencies.find(e => e.id === selectedEmergency.id)) {
          setSelectedEmergency(mappedEmergencies[0] as any);
        } else {
          // Update selected emergency with fresh coordinates/eta
          const updated = mappedEmergencies.find(e => e.id === selectedEmergency.id);
          if (updated) setSelectedEmergency(updated as any);
        }
      }
    });

    return () => {
      unsubscribeEmergency();
    };
  }, [hospital?.name, selectedEmergency?.id, prepState]);

  const handleTogglePrep = async (key: keyof HospitalPreparationState) => {
    if (!selectedEmergency) return;
    const nextState = { ...prepState, [key]: !prepState[key] };
    setPrepState(nextState);
    await hospitalService.updatePreparationState(selectedEmergency.id, nextState);
    addToast({
      variant: 'success',
      title: 'Preparation Updated',
      message: `${key.replace(/([A-Z])/g, ' $1')} marked ${nextState[key] ? 'READY' : 'STANDBY'}.`,
    });
  };

  const handleAcknowledgeArrival = () => {
    if (!selectedEmergency) return;
    addToast({
      variant: 'success',
      title: 'ER Team Standby',
      message: 'Trauma Bay 1 illuminated and team alerted for incoming bay handover.',
    });
  };

  if (!hospital) {
    return <div className="min-h-dvh bg-navy-950 flex items-center justify-center text-navy-400">Loading Hospital ER Dashboard...</div>;
  }

  const matchingAmbulance = selectedEmergency 
    ? mockAmbulances.find(a => a.id === selectedEmergency.ambulanceId) || mockAmbulances[0]
    : mockAmbulances[0];

  const mapCenter: [number, number] = matchingAmbulance?.position || [hospital.location.latitude, hospital.location.longitude];
  const etaMinutes = selectedEmergency?.route?.etaSeconds ? Math.ceil(selectedEmergency.route.etaSeconds / 60) : 4;
  const etaSeconds = selectedEmergency?.route?.etaSeconds ? selectedEmergency.route.etaSeconds % 60 : 15;

  return (
    <AppShell userRole="HOSPITAL" userName={hospital.name} connectionState="connected">
      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        
        {/* Left Side: Map & Incoming Ambulances Stream */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-navy-800">
          
          {/* Top ER Header Status Bar */}
          <div className="bg-navy-900 px-4 py-3 border-b border-navy-800 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-navy-50">{hospital.name}</h1>
                <Badge variant="emergency" size="sm">TRAUMA LEVEL 1</Badge>
              </div>
              <p className="text-xs text-navy-400">Emergency & Critical Care Operations Department</p>
            </div>

            {/* Quick Capacity Badges */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="bg-navy-950 border border-navy-700 px-2.5 py-1 rounded-lg text-center">
                <span className="text-[10px] text-navy-400 uppercase block">ICU Beds</span>
                <span className="text-sm font-bold text-emerald-400">{hospital.availableIcuBeds} Free</span>
              </div>
              <div className="bg-navy-950 border border-navy-700 px-2.5 py-1 rounded-lg text-center">
                <span className="text-[10px] text-navy-400 uppercase block">Trauma Bays</span>
                <span className="text-sm font-bold text-sky-400">{hospital.traumaBaysAvailable} Ready</span>
              </div>
              <div className="bg-navy-950 border border-navy-700 px-2.5 py-1 rounded-lg text-center">
                <span className="text-[10px] text-navy-400 uppercase block">ER Doctors</span>
                <span className="text-sm font-bold text-purple-400">{hospital.doctorsOnDuty} On Duty</span>
              </div>
            </div>
          </div>

          {/* Live Map Area */}
          <div className="flex-1 relative min-h-[300px] bg-navy-950">
            <MapView center={mapCenter} zoom={14}>
              <HospitalMarker
                position={[hospital.location.latitude, hospital.location.longitude]}
                name={hospital.name}
                availableIcuBeds={hospital.availableIcuBeds}
                traumaBaysAvailable={hospital.traumaBaysAvailable}
              />
              {selectedEmergency && matchingAmbulance && (
                <>
                  <AmbulanceMarker
                    position={matchingAmbulance.position}
                    heading={matchingAmbulance.heading}
                    label={selectedEmergency.ambulanceDisplayName}
                    speedKmH={selectedEmergency.currentSpeedKmH || 54}
                    vehicleNumber={selectedEmergency.vehicleNumber}
                  />
                  <RoutePolyline
                    positions={selectedEmergency.route?.polyline || []}
                    congestionSegments={selectedEmergency.route?.congestionSegments}
                    active
                  />
                </>
              )}
            </MapView>

            {/* Floating Live Arrival Countdown Overlay */}
            {selectedEmergency && (
              <div className="absolute top-4 left-4 z-[400] bg-navy-900/95 backdrop-blur border border-emergency-500/50 rounded-xl p-3 shadow-emergency flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emergency-600/20 border border-emergency-500/40 flex items-center justify-center">
                  <Ambulance size={20} className="text-[#EF4444]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emergency-400 uppercase tracking-wider">
                      INCOMING PATIENT
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emergency-500 animate-ping" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white tabular-nums">
                    {etaMinutes}m {etaSeconds.toString().padStart(2, '0')}s
                    <span className="text-xs font-normal text-navy-300 ml-2 font-sans">
                      ({selectedEmergency.currentSpeedKmH || 54} km/h)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Incoming Active Queue Horizontal Bar */}
          <div className="bg-navy-900 border-t border-navy-800 p-3 shrink-0 overflow-x-auto">
            <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-wider mb-2">
              Active En-Route Ambulances ({incomingEmergencies.length})
            </p>
            <div className="flex gap-3">
              {incomingEmergencies.length === 0 ? (
                <span className="text-xs text-navy-500 italic">No incoming emergency units at this moment.</span>
              ) : (
                incomingEmergencies.map((emg) => {
                  const isSelected = selectedEmergency?.id === emg.id;
                  return (
                    <div
                      key={emg.id}
                      onClick={() => {
                        setSelectedEmergency(emg);
                        if (emg.hospitalPrep) setPrepState(emg.hospitalPrep);
                      }}
                      className={`px-3 py-2 rounded-xl border transition-all cursor-pointer min-w-[220px] shrink-0 ${
                        isSelected
                          ? 'bg-emergency-950/60 border-emergency-500/80 shadow-sm'
                          : 'bg-navy-950/70 border-navy-700 hover:border-navy-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-100">{emg.ambulanceDisplayName}</span>
                        <span className="text-[10px] font-mono bg-emergency-900/80 text-emergency-300 px-1.5 py-0.5 rounded font-bold">
                          {emg.priority || 'CODE_RED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-navy-400 mt-1 truncate">
                        {emg.patient?.chiefComplaint || 'Emergency Dispatch'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Patient Triage & Hospital Preparation Checklist */}
        <div className="w-full lg:w-[420px] bg-navy-900 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          
          {selectedEmergency ? (
            <>
              {/* Patient Triage Card */}
              <Card variant="default">
                <div className="flex items-center justify-between border-b border-navy-700 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Patient Triage Card</span>
                    <h3 className="text-base font-bold text-navy-50">
                      {selectedEmergency.patient?.name || 'Emergency Trauma Patient'}
                    </h3>
                    <p className="text-xs text-navy-400">
                      {selectedEmergency.patient?.age || 48} Yrs • {selectedEmergency.patient?.gender === 'M' ? 'Male' : 'Female'} • Category: <strong className="text-emergency-400">{selectedEmergency.patient?.category || 'CARDIAC'}</strong>
                    </p>
                  </div>
                  <Badge variant="danger" size="md">
                    {selectedEmergency.priority || 'CODE_RED'}
                  </Badge>
                </div>

                {/* Chief Complaint */}
                <div className="mb-3 bg-navy-950 p-2.5 rounded-lg border border-navy-800">
                  <span className="text-[10px] text-navy-400 uppercase block font-medium">Chief Complaint</span>
                  <p className="text-xs text-navy-100 mt-0.5 leading-relaxed">
                    {selectedEmergency.patient?.chiefComplaint || 'Acute cardiac distress, severe chest discomfort & shortness of breath.'}
                  </p>
                </div>

                {/* Live Streamed Vitals Grid */}
                <div>
                  <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider block mb-2">
                    Live Paramedic Telemetry Vitals
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-navy-950 p-2 rounded-lg border border-navy-800 text-center">
                      <span className="text-[10px] text-navy-400 block">Heart Rate</span>
                      <span className="text-sm font-bold text-emergency-400 font-mono">
                        {selectedEmergency.patient?.vitals.heartRate || 116} <span className="text-[10px]">bpm</span>
                      </span>
                    </div>
                    <div className="bg-navy-950 p-2 rounded-lg border border-navy-800 text-center">
                      <span className="text-[10px] text-navy-400 block">Blood Pressure</span>
                      <span className="text-sm font-bold text-warning-400 font-mono">
                        {selectedEmergency.patient?.vitals.bloodPressure || '154/92'}
                      </span>
                    </div>
                    <div className="bg-navy-950 p-2 rounded-lg border border-navy-800 text-center">
                      <span className="text-[10px] text-navy-400 block">SpO2 Oxygen</span>
                      <span className="text-sm font-bold text-cyan-400 font-mono">
                        {selectedEmergency.patient?.vitals.spo2 || 92}%
                      </span>
                    </div>
                    <div className="bg-navy-950 p-2 rounded-lg border border-navy-800 text-center">
                      <span className="text-[10px] text-navy-400 block">Resp. Rate</span>
                      <span className="text-sm font-bold text-navy-200 font-mono">
                        {selectedEmergency.patient?.vitals.respiratoryRate || 22}/min
                      </span>
                    </div>
                    <div className="bg-navy-950 p-2 rounded-lg border border-navy-800 text-center">
                      <span className="text-[10px] text-navy-400 block">GCS Coma</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {selectedEmergency.patient?.vitals.gcsScore || 14}/15
                      </span>
                    </div>
                    <div className="bg-navy-950 p-2 rounded-lg border border-navy-800 text-center">
                      <span className="text-[10px] text-navy-400 block">IV Access</span>
                      <span className="text-sm font-bold text-emerald-400">Secured</span>
                    </div>
                  </div>
                </div>

                {/* Paramedic Field Notes */}
                {selectedEmergency.patient?.paramedicNotes && (
                  <div className="mt-3 text-[11px] text-navy-300 bg-navy-950 p-2.5 rounded-lg border border-navy-800">
                    <strong className="text-navy-200 block mb-0.5">Paramedic Dispatch Notes:</strong>
                    {selectedEmergency.patient.paramedicNotes}
                  </div>
                )}

                {/* Assigned Specialist */}
                <div className="mt-3 pt-3 border-t border-navy-800 flex items-center justify-between text-xs">
                  <span className="text-navy-400">Lead ER Specialist:</span>
                  <span className="font-semibold text-purple-300">
                    {selectedEmergency.patient?.leadDoctorAssigned || 'Dr. Ananya Sen (Interventional Cardiology)'}
                  </span>
                </div>
              </Card>

              {/* Hospital Preparation Checklist */}
              <Card variant="default">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-navy-700">
                  <h3 className="text-sm font-bold text-navy-50 uppercase tracking-wider">
                    ER Preparation Checklist
                  </h3>
                  <span className="text-[11px] text-navy-400">Real-Time Sync</span>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-navy-800 hover:border-navy-700 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={prepState.traumaBayReady}
                        onChange={() => handleTogglePrep('traumaBayReady')}
                        className="w-4 h-4 rounded bg-navy-900 border-navy-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-navy-200 font-medium">Trauma Bay 1 Cleared & Primed</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.traumaBayReady ? 'bg-emerald-950 text-emerald-300' : 'bg-navy-800 text-navy-400'}`}>
                      {prepState.traumaBayReady ? 'READY' : 'STANDBY'}
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-navy-800 hover:border-navy-700 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={prepState.icuBedReserved}
                        onChange={() => handleTogglePrep('icuBedReserved')}
                        className="w-4 h-4 rounded bg-navy-900 border-navy-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-navy-200 font-medium">ICU Bed #4 Reserved with Ventilator</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.icuBedReserved ? 'bg-emerald-950 text-emerald-300' : 'bg-navy-800 text-navy-400'}`}>
                      {prepState.icuBedReserved ? 'READY' : 'STANDBY'}
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-navy-800 hover:border-navy-700 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={prepState.otStandby}
                        onChange={() => handleTogglePrep('otStandby')}
                        className="w-4 h-4 rounded bg-navy-900 border-navy-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-navy-200 font-medium">Emergency OT & Cath Lab Standby</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.otStandby ? 'bg-emerald-950 text-emerald-300' : 'bg-navy-800 text-navy-400'}`}>
                      {prepState.otStandby ? 'READY' : 'STANDBY'}
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-navy-800 hover:border-navy-700 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={prepState.bloodReady}
                        onChange={() => handleTogglePrep('bloodReady')}
                        className="w-4 h-4 rounded bg-navy-900 border-navy-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-navy-200 font-medium">Blood Bank: 2 Units O-ve Crossmatched</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.bloodReady ? 'bg-emerald-950 text-emerald-300' : 'bg-navy-800 text-navy-400'}`}>
                      {prepState.bloodReady ? 'READY' : 'STANDBY'}
                    </span>
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-navy-800 hover:border-navy-700 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={prepState.specialistAlerted}
                        onChange={() => handleTogglePrep('specialistAlerted')}
                        className="w-4 h-4 rounded bg-navy-900 border-navy-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-navy-200 font-medium">Cardiology Specialist Team Alerted</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.specialistAlerted ? 'bg-emerald-950 text-emerald-300' : 'bg-navy-800 text-navy-400'}`}>
                      {prepState.specialistAlerted ? 'ALERTED' : 'STANDBY'}
                    </span>
                  </label>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-800">
                  <Button variant="emergency" size="md" fullWidth onClick={handleAcknowledgeArrival}>
                    CONFIRM ER BAY READINESS
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="text-center py-10">
                <div className="flex justify-center mb-4"><div className="w-16 h-16 rounded-2xl bg-[rgba(34,197,94,0.12)] flex items-center justify-center"><Building2 size={32} className="text-[#22C55E]" /></div></div>
                <h3 className="text-sm font-bold text-navy-100">No Active Incoming Ambulance</h3>
                <p className="text-xs text-navy-400 mt-1">
                  ER Team is on regular standby. When an ambulance triggers an SOS route to this hospital, full vitals and ETA telemetry will appear here.
                </p>
              </div>
            </Card>
          )}

        </div>
      </div>
    </AppShell>
  );
}
