import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmergencyStatusBar } from '../../../components/status/EmergencyStatusBar';
import { ETADisplay } from '../../../components/status/ETADisplay';
import { IncidentReportModal } from '../../../components/common/IncidentReportModal';
import { ambulanceService } from '../../../services/ambulanceService';
import { useToast } from '../../../components/ui/Toast';
import type { Emergency } from '../../../types';

interface ActiveEmergencyViewProps {
  emergency: Emergency;
  hospitalName: string;
  onCancel: () => void;
  onComplete: () => void;
  onReroute?: () => void;
  currentSpeedKmH?: number;
}

export function ActiveEmergencyView({
  emergency,
  hospitalName,
  onCancel,
  onComplete,
  onReroute,
  currentSpeedKmH = 54,
}: ActiveEmergencyViewProps) {
  const { addToast } = useToast();
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  const handleReroute = async () => {
    setIsRerouting(true);
    try {
      await ambulanceService.triggerReroute(emergency.id);
      addToast({
        variant: 'warning',
        title: 'Emergency Corridor Rerouted',
        message: 'Route dynamically recalculated to bypass forward traffic congestion.',
      });
      if (onReroute) onReroute();
    } catch {
      addToast({ variant: 'error', title: 'Reroute Failed', message: 'Could not recalculate corridor.' });
    } finally {
      setIsRerouting(false);
    }
  };

  const upcomingJunction = emergency.route?.junctions?.[0];

  return (
    <div className="space-y-3">
      {/* Alert Header Banner */}
      <div className="bg-emergency-950/80 border border-emergency-500/60 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-emergency">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emergency-600/30 border border-emergency-500/40 flex items-center justify-center">
            <span className="w-4 h-4 rounded-full bg-emergency-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emergency-300">EMERGENCY CORRIDOR ACTIVE</h2>
              <Badge variant="emergency" size="sm">{emergency.priority || 'CODE_RED'}</Badge>
            </div>
            <p className="text-[11px] text-navy-400 font-mono">Trip ID: {emergency.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-navy-400 uppercase block">Vehicle Speed</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{currentSpeedKmH} km/h</span>
          </div>
          <ETADisplay
            etaSeconds={emergency.route?.etaSeconds || 310}
            distanceMeters={emergency.route?.distanceMeters || 3800}
            compact
          />
        </div>
      </div>

      {/* Corridor Status Bar */}
      <EmergencyStatusBar status={emergency.status} />

      {/* Telemetry & Route Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <Card variant="compact">
          <div className="space-y-2">
            <div className="flex justify-between border-b border-navy-800 pb-1.5">
              <span className="text-navy-400">Destination</span>
              <span className="font-bold text-navy-100">{hospitalName}</span>
            </div>
            <div className="flex justify-between border-b border-navy-800 pb-1.5">
              <span className="text-navy-400">Patient Category</span>
              <span className="font-semibold text-emergency-400">{emergency.patient?.category || 'CARDIAC'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-400">Police Support</span>
              <span className={`font-semibold ${emergency.acceptedBy ? 'text-emerald-400' : 'text-amber-400'}`}>
                {emergency.acceptedBy ? `Assigned (${emergency.acceptedBy.displayName})` : 'Green Wave Broadcasted'}
              </span>
            </div>
          </div>
        </Card>

        <Card variant="compact">
          <div className="space-y-2">
            <div className="flex justify-between border-b border-navy-800 pb-1.5">
              <span className="text-navy-400">Upcoming Junction</span>
              <span className="font-semibold text-sky-400">{upcomingJunction?.name || 'MG Road Junction'}</span>
            </div>
            <div className="flex justify-between border-b border-navy-800 pb-1.5">
              <span className="text-navy-400">Junction Status</span>
              <span className="font-bold text-emerald-400">
                {upcomingJunction?.status === 'CLEARED' ? '🟢 GREEN WAVE (Cleared)' : '🟡 PREPARING'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-400">Hospital Bay</span>
              <span className={`font-bold ${emergency.hospitalPrep?.traumaBayReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                {emergency.hospitalPrep?.traumaBayReady ? 'Trauma Bay 1 Ready' : 'Standby / Prepping'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2.5 pt-1">
        <Button
          variant="outline"
          size="md"
          className="flex-1 min-w-[130px] text-xs font-semibold"
          onClick={() => setShowIncidentModal(true)}
        >
          ⚠️ Report Road Blockage
        </Button>

        <Button
          variant="primary"
          size="md"
          className="flex-1 min-w-[130px] text-xs font-semibold"
          onClick={handleReroute}
          loading={isRerouting}
        >
          🔄 Reroute Corridor
        </Button>

        <Button
          variant="danger"
          size="md"
          className="flex-1 min-w-[100px] text-xs font-semibold"
          onClick={onCancel}
        >
          Cancel SOS
        </Button>

        <Button
          variant="success"
          size="md"
          className="flex-1 min-w-[130px] text-xs font-semibold"
          onClick={onComplete}
        >
          Arrived at ER
        </Button>
      </div>

      {/* Road Blockage / Incident Report Modal */}
      <IncidentReportModal
        open={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        reporterName={`${emergency.ambulanceDisplayName} (${emergency.vehicleNumber || 'KA-01'})`}
      />
    </div>
  );
}
