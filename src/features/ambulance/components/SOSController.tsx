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
        title={state === 'CONFIRMING' ? 'Confirm Emergency SOS' : 'Initiating SOS Corridor'}
        variant="emergency"
        confirmLabel="CONFIRM SOS"
        cancelLabel={state === 'COUNTDOWN' ? 'CANCEL (Aborting)' : 'Cancel'}
      >
        <div className="space-y-4">
          <p className="text-sm text-navy-200">
            {state === 'COUNTDOWN'
              ? 'Computing live OSRM route & broadcasting green-wave to police…'
              : 'You are about to notify traffic police and hospital ER of an active emergency trip.'}
          </p>

          <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-navy-400">Unit ID</span>
              <span className="font-bold text-navy-100">{ambulanceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-400">Destination</span>
              <span className="font-bold text-emerald-400 truncate ml-2 text-right max-w-[200px]">{hospital.name}</span>
            </div>
            {distLabel && (
              <div className="flex justify-between">
                <span className="text-navy-400">Distance</span>
                <span className="font-bold text-cyan-300">{distLabel}</span>
              </div>
            )}
            {currentPos && (
              <div className="flex justify-between font-mono">
                <span className="text-navy-400">Origin GPS</span>
                <span className="text-cyan-300">{currentPos[0].toFixed(4)}, {currentPos[1].toFixed(4)}</span>
              </div>
            )}
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
