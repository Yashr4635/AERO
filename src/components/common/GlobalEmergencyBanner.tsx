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
    <div className="bg-[#FF3B30]/10 border-b border-[#FF3B30]/30 px-4 py-2 flex items-center justify-between shadow-lg z-50 text-xs shrink-0">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] animate-ping shrink-0" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#FF3B30] tracking-wider uppercase">
            LIVE EMERGENCY ({activeEmergency.id})
          </span>
          <span className="text-[#FF3B30]/60 hidden sm:inline">•</span>
          <span className="text-text-primary font-medium">
            {activeEmergency.ambulanceDisplayName} → {activeEmergency.hospital.name}
          </span>
          <span className="bg-[#FF3B30]/20 text-[#FF3B30] px-2 py-0.5 rounded font-mono font-bold">
            {activeEmergency.priority || 'CODE_RED'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          <span className="text-text-secondary block text-[10px]">CURRENT ETA</span>
          <span className="text-[#FF3B30] font-bold font-mono text-sm">{etaMins} MINS</span>
        </div>
        <div className="text-right">
          <span className="text-text-secondary block text-[10px]">SPEED</span>
          <span className="text-[#20D67A] font-bold font-mono text-sm">{activeEmergency.currentSpeedKmH || 54} km/h</span>
        </div>
      </div>
    </div>
  );
}
