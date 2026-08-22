import { useState, useEffect } from 'react';
import { SOSButton } from '../../../components/status/SOSButton';
import { Dialog } from '../../../components/ui/Dialog';
import { useToast } from '../../../components/ui/Toast';
import { ambulanceService } from '../../../services/ambulanceService';
import type { Emergency, Hospital, PatientInfo } from '../../../types';

interface SOSControllerProps {
  /** Full hospital object — works for both mock and live OSM hospitals */
  hospital: Hospital;
  ambulanceId: string;
  currentPos?: [number, number];
  patientData?: Partial<PatientInfo>;
  onEmergencyActive: (emergency: Emergency) => void;
  className?: string;
}

type SOSState = 'IDLE' | 'CONFIRMING' | 'COUNTDOWN' | 'SENDING' | 'SENT';

export function SOSController({
  hospital,
  ambulanceId,
  currentPos,
  patientData,
  onEmergencyActive,
  className,
}: SOSControllerProps) {
  const [state, setState] = useState<SOSState>('IDLE');
  const [countdown, setCountdown] = useState(3);
  const { addToast } = useToast();

  useEffect(() => {
    if (state === 'COUNTDOWN') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setState('SENDING');
      }
    }
  }, [state, countdown]);

  useEffect(() => {
    if (state !== 'SENDING') return;

    ambulanceService
      .requestSOS(ambulanceId, hospital, patientData, currentPos)
      .then(emergency => {
        setState('SENT');
        addToast({
          variant: 'success',
          title: '🚨 SOS Active & Broadcasted',
          message: `Live route calculated to ${hospital.name}. Police & Hospital notified.`,
        });
        setTimeout(() => {
          setState('IDLE');
          onEmergencyActive(emergency);
        }, 1200);
      })
      .catch(err => {
        console.error('SOS failed:', err);
        setState('IDLE');
        addToast({
          variant: 'error',
          title: 'SOS Failed',
          message: 'Could not activate emergency corridor. Check GPS and try again.',
        });
      });
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSOSClick = () => {
    if (!hospital?.id) return;
    setState('CONFIRMING');
  };

  const handleConfirm = () => {
    setCountdown(3);
    setState('COUNTDOWN');
  };

  const handleCancel = () => setState('IDLE');

  const distLabel = (hospital as any).distanceLabel || (hospital.distanceKm ? `${hospital.distanceKm} km` : '');

  return (
    <div className={className}>
      <SOSButton
        onConfirm={handleSOSClick}
        disabled={!hospital?.id || state !== 'IDLE'}
        loading={state === 'SENDING' || state === 'SENT'}
        disabledReason={!hospital?.id ? 'Select a hospital first' : undefined}
      />

      <Dialog
        open={state === 'CONFIRMING' || state === 'COUNTDOWN'}
        onClose={state === 'CONFIRMING' ? handleCancel : () => {}}
        onConfirm={state === 'CONFIRMING' ? handleConfirm : undefined}
        title={state === 'CONFIRMING' ? 'EMERGENCY CONFIRMATION' : 'Initiating SOS Corridor'}
        variant="emergency"
        confirmLabel="CONFIRM EMERGENCY"
        cancelLabel={state === 'COUNTDOWN' ? 'CANCEL (Aborting)' : 'Cancel'}
      >
        <div className="space-y-4">
          <p className="text-sm text-navy-200">
            {state === 'COUNTDOWN'
              ? 'Computing live OSRM route & broadcasting green-wave to police…'
              : 'Please review the emergency details before raising the SOS.'}
          </p>

          <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 text-xs space-y-3">
            <div className="flex flex-col">
              <span className="text-navy-400 uppercase tracking-widest text-[10px]">Emergency:</span>
              <span className="font-bold text-white text-sm">{patientData?.category || 'General'}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="text-navy-400 uppercase tracking-widest text-[10px]">Priority:</span>
              <span className="font-bold text-red-400 text-sm">{patientData?.priority || 'Critical'}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-navy-400 uppercase tracking-widest text-[10px]">Current Location:</span>
              <span className="font-bold text-cyan-300 font-mono text-xs">{currentPos ? `${currentPos[0].toFixed(5)}, ${currentPos[1].toFixed(5)}` : 'LIVE GPS'}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-navy-400 uppercase tracking-widest text-[10px]">Destination:</span>
              <span className="font-bold text-emerald-400 text-sm">{hospital.name}</span>
            </div>

            <div className="flex flex-col">
              <span className="text-navy-400 uppercase tracking-widest text-[10px]">Route:</span>
              <span className="font-bold text-navy-100 text-xs">OSRM Computed Route</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-navy-400 uppercase tracking-widest text-[10px]">Distance:</span>
                <span className="font-bold text-white text-sm">{distLabel}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-navy-400 uppercase tracking-widest text-[10px]">Estimated Travel Time:</span>
                <span className="font-bold text-white text-sm">{(hospital as any).drivingEtaSeconds ? Math.round((hospital as any).drivingEtaSeconds/60) : '--'} min</span>
              </div>
            </div>
          </div>

          {state === 'COUNTDOWN' && (
            <div className="text-center py-4">
              <span className="text-4xl font-bold text-emergency-500 tabular-nums animate-pulse">
                {countdown}
              </span>
              <p className="text-xs text-navy-400 mt-2">Transmitting in {countdown}s…</p>
              <button
                onClick={handleCancel}
                className="mt-4 px-4 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg text-xs text-navy-200 font-medium transition-colors cursor-pointer border border-navy-700"
              >
                Abort SOS
              </button>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
