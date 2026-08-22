import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import { supabase } from '../../../lib/supabase';
import type { EmergencyIncident } from '../../../types';

interface ActiveEmergencyViewProps {
  emergency: EmergencyIncident;
  hospitalName: string;
  onCancel: () => void;
  onComplete: () => void;
  currentSpeedKmH?: number;
}

export function ActiveEmergencyView({
  emergency,
  hospitalName,
  onCancel,
  onComplete,
  currentSpeedKmH = 0,
}: ActiveEmergencyViewProps) {
  const { addToast } = useToast();

  const handleCancel = async () => {
    const { error } = await supabase.from('emergency_incidents').update({ status: 'resolved' }).eq('id', emergency.id);
    if (!error) {
      addToast({ variant: 'info', title: 'Emergency Cancelled', message: 'The trip was aborted.' });
      onCancel();
    }
  };

  const handleComplete = async () => {
    const { error } = await supabase.from('emergency_incidents').update({ status: 'resolved' }).eq('id', emergency.id);
    if (!error) {
      addToast({ variant: 'success', title: 'Mission Completed', message: 'Patient delivered to ER.' });
      onComplete();
    }
  };

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
            <p className="text-[11px] text-navy-400 font-mono">Trip ID: {emergency.id.substring(0, 8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-navy-400 uppercase block">Vehicle Speed</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{Math.round(currentSpeedKmH)} km/h</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-xs">
        <Card variant="compact">
          <div className="space-y-2">
            <div className="flex justify-between border-b border-navy-800 pb-1.5">
              <span className="text-navy-400">Destination</span>
              <span className="font-bold text-navy-100">{hospitalName}</span>
            </div>
            <div className="flex justify-between border-b border-navy-800 pb-1.5">
              <span className="text-navy-400">Patient Category</span>
              <span className="font-semibold text-emergency-400">{emergency.incident_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-navy-400">Police Status</span>
              <span className={`font-semibold ${emergency.corridor_status === 'CLEAR' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {emergency.corridor_status || 'PENDING'} {emergency.police_acknowledged_at ? '(Acknowledged)' : ''}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button variant="outline" className="w-full" onClick={handleCancel}>
          Abort Mission
        </Button>
        <Button variant="success" className="w-full" onClick={handleComplete}>
          Complete Mission
        </Button>
      </div>
    </div>
  );
}
