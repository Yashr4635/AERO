import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserRole, ConnectionState, GPSState } from '../../types';
import { ConnectionIndicator } from '../status/ConnectionIndicator';
import { GPSIndicator } from '../status/GPSIndicator';
import { Badge } from '../ui/Badge';
import { AccountMenu } from './AccountMenu';
import { audioAlert } from '../../utils/audioAlert';

interface StatusBarProps {
  userRole?: UserRole;
  userName?: string;
  connectionState: ConnectionState;
  gpsState?: GPSState;
  gpsAccuracy?: number;
}

const roleLabels: Record<UserRole, string> = {
  AMBULANCE: 'Ambulance Unit',
  POLICE: 'Traffic Police',
  HOSPITAL: 'Hospital ER',
  ADMIN: 'Control Center Admin',
};

const roleBadgeVariant: Record<UserRole, 'info' | 'warning' | 'emergency' | 'neutral'> = {
  AMBULANCE: 'info',
  POLICE: 'warning',
  HOSPITAL: 'emergency',
  ADMIN: 'neutral',
};

export function StatusBar({
  userRole,
  userName,
  connectionState,
  gpsState,
  gpsAccuracy,
}: StatusBarProps) {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(audioAlert.getIsMuted());

  const toggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioAlert.setMuted(nextMuted);
    if (!nextMuted) {
      audioAlert.playSuccessChime();
    }
  };

  return (
    <header className="h-14 bg-bg-surface border-b border-border-subtle flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
      {/* Left: Brand & Role */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* AERO Logo Mark */}
          <div className="w-8 h-8 rounded-lg bg-[#E53935] flex items-center justify-center shadow-[0_0_12px_rgba(229,57,53,0.4)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="white" opacity="0.95"/>
              <path d="M9 12h6M12 9v6" stroke="#07090C" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight text-white font-sans">
            AERO
          </span>
        </div>

        {userRole && (
          <div className="flex items-center ml-2 border-l border-border-subtle pl-4">
            <Badge variant={roleBadgeVariant[userRole]} size="sm">
              {roleLabels[userRole]}
            </Badge>
          </div>
        )}
      </div>

      {/* Right: Indicators & Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Audio Siren Alert Toggle */}
        <button
          onClick={toggleAudio}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
            isMuted
              ? 'bg-transparent text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-strong'
              : 'bg-[#E53935]/10 text-[#E53935] border-[#E53935]/20 hover:bg-[#E53935]/20'
          }`}
          title={isMuted ? 'Unmute Audio Siren Alerts' : 'Mute Audio Siren Alerts'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {isMuted
              ? <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
              : <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
            }
          </svg>
          <span>{isMuted ? 'Muted' : 'Siren ON'}</span>
        </button>

        {gpsState && (
          <GPSIndicator state={gpsState} accuracy={gpsAccuracy} />
        )}
        <ConnectionIndicator state={connectionState} />
        {userName && userRole && (
          <>
            <div className="w-px h-6 bg-border-subtle hidden sm:block mx-1" />
            <AccountMenu userName={userName} userRole={userRole} />
          </>
        )}
      </div>
    </header>
  );
}
