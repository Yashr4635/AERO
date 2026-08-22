import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useToast } from '../ui/Toast';
import { trafficService } from '../../services/trafficService';
import type { IncidentType, IncidentSeverity } from '../../types';

interface IncidentReportModalProps {
  open: boolean;
  onClose: () => void;
  reporterName: string;
  defaultPosition?: [number, number];
}

export function IncidentReportModal({
  open,
  onClose,
  reporterName,
  defaultPosition = [12.9730, 77.6050],
}: IncidentReportModalProps) {
  const { addToast } = useToast();
  const [type, setType] = useState<IncidentType>('ROAD_BLOCKAGE');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast({ variant: 'error', title: 'Incomplete Details', message: 'Please provide title and description.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await trafficService.reportIncident({
        type,
        severity,
        title,
        description,
        location: { latitude: defaultPosition[0], longitude: defaultPosition[1] },
        reportedBy: reporterName,
      });

      addToast({
        variant: 'warning',
        title: 'Hazard Reported',
        message: 'Incident broadcasted to emergency fleet & traffic police.',
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch {
      addToast({ variant: 'error', title: 'Submission Failed', message: 'Could not report incident.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-navy-900 border border-navy-700 rounded-2xl p-6 shadow-modal space-y-4">
        <div className="flex items-center justify-between border-b border-navy-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center text-lg">⚠️</span>
            <div>
              <h2 className="text-base font-bold text-navy-50">Report Traffic Incident</h2>
              <p className="text-xs text-navy-400">Broadcast blockage or accident to emergency units</p>
            </div>
          </div>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-200 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Incident Type"
              value={type}
              onChange={(e) => setType(e.target.value as IncidentType)}
              options={[
                { value: 'ROAD_BLOCKAGE', label: '🚧 Road Blockage' },
                { value: 'ACCIDENT', label: '💥 Vehicle Collision' },
                { value: 'CONGESTION', label: '🚗 Gridlock Traffic' },
                { value: 'CONSTRUCTION', label: '🏗️ Road Works' },
                { value: 'WATERLOGGING', label: '🌊 Waterlogging' },
              ]}
            />
            <Select
              label="Severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              options={[
                { value: 'CRITICAL', label: '🔴 Critical (Impasse)' },
                { value: 'HIGH', label: '🟠 High (Severe Delay)' },
                { value: 'MEDIUM', label: '🟡 Medium (Slow Flow)' },
                { value: 'LOW', label: '🟢 Low (Minor Caution)' },
              ]}
            />
          </div>

          <Input
            label="Incident Headline"
            placeholder="e.g. Broken down truck blocking 2 lanes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-navy-100">Details & Diversion Guidance</label>
            <textarea
              rows={3}
              placeholder="Provide exact landmarks, lane blocked, or suggested alternate street..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 bg-navy-950 border border-navy-700 rounded-lg text-sm text-navy-50 placeholder-navy-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-shadow"
            />
          </div>

          <div className="bg-navy-950 p-2.5 rounded-lg border border-navy-800 flex items-center justify-between text-xs text-navy-400">
            <span>Reporter: <strong>{reporterName}</strong></span>
            <span>Coordinates: {defaultPosition[0].toFixed(4)}, {defaultPosition[1].toFixed(4)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="emergency" loading={isSubmitting}>
              BROADCAST HAZARD ALERT
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
