import { useState, useEffect } from 'react';
import { AppShell } from '../../../components/layout/AppShell';
import { MapView, AmbulanceMarker, HospitalMarker, RoutePolyline } from '../../../components/map';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { hospitalService } from '../../../services/hospitalService';
import { realtimeService } from '../../../services/realtimeService';
import { mockAmbulances } from '../../../mock';
import type { Emergency, Hospital, HospitalPreparationState } from '../../../types';
import { motion, AnimatePresence } from 'framer-motion';

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
    // Load hospital details (Bowring & Lady Curzon / Victoria)
    hospitalService.getHospitalState('HOSP-002').then(setHospital);
    hospitalService.getIncomingEmergencies('HOSP-002').then((emergencies) => {
      setIncomingEmergencies(emergencies);
      if (emergencies.length > 0) {
        setSelectedEmergency(emergencies[0]);
        if (emergencies[0].hospitalPrep) {
          setPrepState(emergencies[0].hospitalPrep);
        }
      }
    });

    const unsubscribeEmergency = realtimeService.on('hospital_alert', (emergency: Emergency) => {
      setIncomingEmergencies(prev => {
        const filtered = prev.filter(e => e.id !== emergency.id);
        if (emergency.status === 'ACTIVE' || emergency.status === 'ACCEPTED') {
          return [emergency, ...filtered];
        }
        return filtered;
      });

      if (!selectedEmergency || selectedEmergency.id === emergency.id) {
        setSelectedEmergency(emergency);
        if (emergency.hospitalPrep) {
          setPrepState(emergency.hospitalPrep);
        }
      }
    });

    const unsubscribeLocation = realtimeService.on('ambulance_location', (data: { ambulanceId: string; etaSeconds: number; speedKmH: number }) => {
      setSelectedEmergency(prev => {
        if (!prev || prev.ambulanceId !== data.ambulanceId) return prev;
        return {
          ...prev,
          currentSpeedKmH: data.speedKmH,
          route: {
            ...prev.route!,
            etaSeconds: data.etaSeconds,
          },
        };
      });
    });

    return () => {
      unsubscribeEmergency();
      unsubscribeLocation();
    };
  }, []);

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
    return <div className="min-h-dvh bg-bg-main flex items-center justify-center text-text-secondary">Loading Hospital ER Dashboard...</div>;
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
        <div className="flex-1 flex flex-col min-h-0 border-r border-border-subtle">
          
          {/* Top ER Header Status Bar */}
          <div className="bg-bg-surface px-4 py-3 border-b border-border-subtle flex items-center justify-between shrink-0 shadow-sm z-10">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white">{hospital.name}</h1>
                <Badge variant="emergency" size="sm">TRAUMA LEVEL 1</Badge>
              </div>
              <p className="text-xs text-text-secondary font-medium mt-1">Emergency & Critical Care Operations Department</p>
            </div>

            {/* Quick Capacity Badges */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="bg-bg-main border border-border-subtle px-3 py-1.5 rounded-lg text-center shadow-sm">
                <span className="telemetry-label mb-1">ICU Beds</span>
                <span className="text-sm font-bold text-[#20D67A]">{hospital.availableIcuBeds} Free</span>
              </div>
              <div className="bg-bg-main border border-border-subtle px-3 py-1.5 rounded-lg text-center shadow-sm">
                <span className="telemetry-label mb-1">Trauma Bays</span>
                <span className="text-sm font-bold text-[#35C7FF]">{hospital.traumaBaysAvailable} Ready</span>
              </div>
              <div className="bg-bg-main border border-border-subtle px-3 py-1.5 rounded-lg text-center shadow-sm">
                <span className="telemetry-label mb-1">ER Doctors</span>
                <span className="text-sm font-bold text-[#FFB020]">{hospital.doctorsOnDuty} On Duty</span>
              </div>
            </div>
          </div>

          {/* Live Map Area */}
          <div className="flex-1 relative min-h-[300px] bg-bg-main">
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
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-4 left-4 z-[400] bg-bg-surface/95 backdrop-blur-md border border-[#FF3B30]/30 rounded-xl p-3 shadow-lg flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center text-xl">
                  🚑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#FF3B30] uppercase tracking-wider">
                      INCOMING PATIENT
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-ping" />
                  </div>
                  <div className="text-xl font-bold font-mono text-white tabular-nums">
                    {etaMinutes}m {etaSeconds.toString().padStart(2, '0')}s
                    <span className="text-xs font-medium text-text-secondary ml-2 font-sans">
                      ({selectedEmergency.currentSpeedKmH || 54} km/h)
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Incoming Active Queue Horizontal Bar */}
          <div className="bg-bg-surface border-t border-border-subtle p-3 shrink-0 overflow-x-auto shadow-none">
            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
              Active En-Route Ambulances ({incomingEmergencies.length})
            </p>
            <div className="flex gap-3">
              {incomingEmergencies.length === 0 ? (
                <span className="text-xs text-text-secondary italic font-medium">No incoming emergency units at this moment.</span>
              ) : (
                incomingEmergencies.map((emg) => {
                  const isSelected = selectedEmergency?.id === emg.id;
                  return (
                    <motion.div
                      whileHover={{ y: -2 }}
                      key={emg.id}
                      onClick={() => {
                        setSelectedEmergency(emg);
                        if (emg.hospitalPrep) setPrepState(emg.hospitalPrep);
                      }}
                      className={`px-3 py-2 rounded-xl border transition-all cursor-pointer min-w-[220px] shrink-0 ${
                        isSelected
                          ? 'bg-[#FF3B30]/10 border-[#FF3B30]/30 shadow-sm'
                          : 'bg-bg-main border-border-subtle hover:border-border-strong shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{emg.ambulanceDisplayName}</span>
                        <span className="text-[10px] font-mono bg-[#FF3B30]/10 text-[#FF3B30] px-1.5 py-0.5 rounded font-bold">
                          {emg.priority || 'CODE_RED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary font-medium mt-1 truncate">
                        {emg.patient?.chiefComplaint || 'Emergency Dispatch'}
                      </p>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Patient Triage & Hospital Preparation Checklist */}
        <div className="w-full lg:w-[420px] bg-bg-main flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 border-l border-border-subtle">
          
          <AnimatePresence mode="wait">
            {selectedEmergency ? (
              <motion.div 
                key="active"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Patient Triage Card */}
                <div className="enterprise-card">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-3">
                    <div>
                      <span className="telemetry-label mb-1">Patient Triage Card</span>
                      <h3 className="text-base font-bold text-white">
                        {selectedEmergency.patient?.name || 'Emergency Trauma Patient'}
                      </h3>
                      <p className="text-xs text-text-secondary font-medium">
                        {selectedEmergency.patient?.age || 48} Yrs • {selectedEmergency.patient?.gender === 'M' ? 'Male' : 'Female'} • Category: <strong className="text-[#FF3B30]">{selectedEmergency.patient?.category || 'CARDIAC'}</strong>
                      </p>
                    </div>
                    <Badge variant="danger" size="md">
                      {selectedEmergency.priority || 'CODE_RED'}
                    </Badge>
                  </div>

                  {/* Chief Complaint */}
                  <div className="mb-3 bg-bg-main p-3 rounded-lg border border-border-subtle">
                    <span className="telemetry-label mb-1">Chief Complaint</span>
                    <p className="text-xs text-white font-medium mt-0.5 leading-relaxed">
                      {selectedEmergency.patient?.chiefComplaint || 'Acute cardiac distress, severe chest discomfort & shortness of breath.'}
                    </p>
                  </div>

                  {/* Live Streamed Vitals Grid */}
                  <div>
                    <span className="telemetry-label mb-2">
                      Live Paramedic Telemetry Vitals
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-bg-main p-2 rounded-lg border border-border-subtle text-center">
                        <span className="telemetry-label mb-1">Heart Rate</span>
                        <span className="text-sm font-bold text-[#FF3B30] font-mono">
                          {selectedEmergency.patient?.vitals.heartRate || 116} <span className="text-[10px]">bpm</span>
                        </span>
                      </div>
                      <div className="bg-bg-main p-2 rounded-lg border border-border-subtle text-center">
                        <span className="telemetry-label mb-1">Blood Pressure</span>
                        <span className="text-sm font-bold text-[#FFB020] font-mono">
                          {selectedEmergency.patient?.vitals.bloodPressure || '154/92'}
                        </span>
                      </div>
                      <div className="bg-bg-main p-2 rounded-lg border border-border-subtle text-center">
                        <span className="telemetry-label mb-1">SpO2 Oxygen</span>
                        <span className="text-sm font-bold text-[#35C7FF] font-mono">
                          {selectedEmergency.patient?.vitals.spo2 || 92}%
                        </span>
                      </div>
                      <div className="bg-bg-main p-2 rounded-lg border border-border-subtle text-center">
                        <span className="telemetry-label mb-1">Resp. Rate</span>
                        <span className="text-sm font-bold text-white font-mono">
                          {selectedEmergency.patient?.vitals.respiratoryRate || 22}/min
                        </span>
                      </div>
                      <div className="bg-bg-main p-2 rounded-lg border border-border-subtle text-center">
                        <span className="telemetry-label mb-1">GCS Coma</span>
                        <span className="text-sm font-bold text-[#20D67A] font-mono">
                          {selectedEmergency.patient?.vitals.gcsScore || 14}/15
                        </span>
                      </div>
                      <div className="bg-bg-main p-2 rounded-lg border border-border-subtle text-center">
                        <span className="telemetry-label mb-1">IV Access</span>
                        <span className="text-sm font-bold text-[#20D67A]">Secured</span>
                      </div>
                    </div>
                  </div>

                  {/* Paramedic Field Notes */}
                  {selectedEmergency.patient?.paramedicNotes && (
                    <div className="mt-3 text-[11px] text-white font-medium bg-[#35C7FF]/10 p-3 rounded-lg border border-[#35C7FF]/20">
                      <strong className="text-[#35C7FF] block mb-0.5 uppercase tracking-wider text-[10px]">Paramedic Dispatch Notes:</strong>
                      {selectedEmergency.patient.paramedicNotes}
                    </div>
                  )}

                  {/* Assigned Specialist */}
                  <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-medium">Lead ER Specialist:</span>
                    <span className="font-bold text-[#FFB020]">
                      {selectedEmergency.patient?.leadDoctorAssigned || 'Dr. Ananya Sen (Interventional Cardiology)'}
                    </span>
                  </div>
                </div>

                {/* Hospital Preparation Checklist */}
                <div className="enterprise-card">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-subtle">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      ER Preparation Checklist
                    </h3>
                    <span className="text-[11px] font-bold text-[#35C7FF]">Real-Time Sync</span>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-bg-main border border-border-subtle hover:border-border-strong cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={prepState.traumaBayReady}
                          onChange={() => handleTogglePrep('traumaBayReady')}
                          className="w-4 h-4 rounded bg-bg-main border-border-strong text-[#20D67A] focus:ring-[#20D67A] focus:ring-offset-bg-main"
                        />
                        <span className="text-xs text-white font-bold">Trauma Bay 1 Cleared & Primed</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.traumaBayReady ? 'bg-[#20D67A]/10 text-[#20D67A]' : 'bg-bg-elevated text-text-secondary'}`}>
                        {prepState.traumaBayReady ? 'READY' : 'STANDBY'}
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-bg-main border border-border-subtle hover:border-border-strong cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={prepState.icuBedReserved}
                          onChange={() => handleTogglePrep('icuBedReserved')}
                          className="w-4 h-4 rounded bg-bg-main border-border-strong text-[#20D67A] focus:ring-[#20D67A] focus:ring-offset-bg-main"
                        />
                        <span className="text-xs text-white font-bold">ICU Bed #4 Reserved with Ventilator</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.icuBedReserved ? 'bg-[#20D67A]/10 text-[#20D67A]' : 'bg-bg-elevated text-text-secondary'}`}>
                        {prepState.icuBedReserved ? 'READY' : 'STANDBY'}
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-bg-main border border-border-subtle hover:border-border-strong cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={prepState.otStandby}
                          onChange={() => handleTogglePrep('otStandby')}
                          className="w-4 h-4 rounded bg-bg-main border-border-strong text-[#20D67A] focus:ring-[#20D67A] focus:ring-offset-bg-main"
                        />
                        <span className="text-xs text-white font-bold">Emergency OT & Cath Lab Standby</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.otStandby ? 'bg-[#20D67A]/10 text-[#20D67A]' : 'bg-bg-elevated text-text-secondary'}`}>
                        {prepState.otStandby ? 'READY' : 'STANDBY'}
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-bg-main border border-border-subtle hover:border-border-strong cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={prepState.bloodReady}
                          onChange={() => handleTogglePrep('bloodReady')}
                          className="w-4 h-4 rounded bg-bg-main border-border-strong text-[#20D67A] focus:ring-[#20D67A] focus:ring-offset-bg-main"
                        />
                        <span className="text-xs text-white font-bold">Blood Bank: 2 Units O-ve Crossmatched</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.bloodReady ? 'bg-[#20D67A]/10 text-[#20D67A]' : 'bg-bg-elevated text-text-secondary'}`}>
                        {prepState.bloodReady ? 'READY' : 'STANDBY'}
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-2.5 rounded-lg bg-bg-main border border-border-subtle hover:border-border-strong cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={prepState.specialistAlerted}
                          onChange={() => handleTogglePrep('specialistAlerted')}
                          className="w-4 h-4 rounded bg-bg-main border-border-strong text-[#20D67A] focus:ring-[#20D67A] focus:ring-offset-bg-main"
                        />
                        <span className="text-xs text-white font-bold">Cardiology Specialist Team Alerted</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${prepState.specialistAlerted ? 'bg-[#20D67A]/10 text-[#20D67A]' : 'bg-bg-elevated text-text-secondary'}`}>
                        {prepState.specialistAlerted ? 'ALERTED' : 'STANDBY'}
                      </span>
                    </label>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border-subtle">
                    <button 
                      className="enterprise-button-primary w-full py-3"
                      onClick={handleAcknowledgeArrival}
                    >
                      CONFIRM ER BAY READINESS
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="enterprise-card p-8 shadow-none"
              >
                <div className="text-center py-10">
                  <span className="text-4xl block mb-4">🏥</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Active Incoming Ambulance</h3>
                  <p className="text-xs text-text-secondary font-medium mt-2 leading-relaxed">
                    ER Team is on regular standby. When an ambulance triggers an SOS route to this hospital, full vitals and ETA telemetry will appear here.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}
