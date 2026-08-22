import { useState, useEffect } from 'react';
import { realtimeService } from '../../services/realtimeService';
import type { Emergency } from '../../types';

export function GlobalEmergencyBanner() {
  const [activeEmergency, setActiveEmergency] = useState<Emergency | null>(null);

  useEffect(() => {
    setActiveEmergency(realtimeService.getActiveEmergency());

    const unsubscribe = realtimeService.on('emergency_status', (emergency: Emergency) => {
      if (emergency.status === 'ACTIVE' || emergency.status === 'ACCEPTED') {
        setActiveEmergency(emergency);
      } else {
        setActiveEmergency(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!activeEmergency || activeEmergency.status === 'COMPLETED' || activeEmergency.status === 'CANCELLED') {
    return null;
  }

  const etaMins = Math.round((activeEmergency.route?.etaSeconds || 0) / 60);

  return (
    <div className="bg-emergency-950 border-b border-emergency-700/80 px-4 py-2 flex items-center justify-between shadow-emergency z-50 text-xs shrink-0">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 animate-ping shrink-0" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-emergency-200 tracking-wider uppercase">
            LIVE EMERGENCY ({activeEmergency.id})
          </span>
          <span className="text-emergency-300/80 hidden sm:inline">•</span>
          <span className="text-navy-100 font-medium">
            {activeEmergency.ambulanceDisplayName} → {activeEmergency.hospital.name}
          </span>
          <span className="bg-emergency-900 text-emergency-300 px-2 py-0.5 rounded font-mono font-bold">
            {activeEmergency.priority || 'CODE_RED'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          <span className="text-navy-400 block text-[10px]">CURRENT ETA</span>
          <span className="text-emergency-400 font-bold font-mono text-sm">{etaMins} MINS</span>
        </div>
        <div className="text-right">
          <span className="text-navy-400 block text-[10px]">SPEED</span>
          <span className="text-emerald-400 font-bold font-mono text-sm">{activeEmergency.currentSpeedKmH || 54} km/h</span>
        </div>
      </div>
    </div>
  );
}
