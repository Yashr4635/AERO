import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import type { EmergencyIncident } from '../../../types';

interface IncomingEmergencyAlertProps {
  emergency: EmergencyIncident;
  hospitalName: string;
  ambulanceName: string;
  onAccept: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function IncomingEmergencyAlert({ emergency, hospitalName, ambulanceName, onAccept, onViewDetails }: IncomingEmergencyAlertProps) {
  const distanceKm = ((emergency.route_distance_meters || 0) / 1000).toFixed(1);
  const etaMins = Math.round((emergency.route_duration_seconds || 0) / 60);
  const timeSince = new Date(emergency.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="animate-fade-in mb-3">
      <Alert
        variant="emergency"
        title="INCOMING EMERGENCY ALERT"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onViewDetails(emergency.id)}>
              VIEW DETAILS
            </Button>
            <Button variant="emergency" size="sm" onClick={() => onAccept(emergency.id)}>
              OPEN CORRIDOR
            </Button>
          </div>
        }
      >
        <div className="space-y-1.5 mt-1">
          <p><strong>{ambulanceName}</strong> → {hospitalName}</p>
          <p className="text-[12px] opacity-75">
            Priority: {emergency.priority.toUpperCase()} | Distance: {distanceKm} km | ETA: {etaMins} min | Received: {timeSince}
          </p>
        </div>
      </Alert>
    </div>
  );
}
