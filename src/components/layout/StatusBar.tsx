
import { useNavigate } from 'react-router-dom';
import type { UserRole, ConnectionState, GPSState } from '../../types';
import { ConnectionIndicator } from '../status/ConnectionIndicator';
import { GPSIndicator } from '../status/GPSIndicator';
import { Badge } from '../ui/Badge';
import { AccountMenu } from './AccountMenu';

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
  // const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  return (
    <header className="h-12 bg-navy-900 border-b border-navy-700/80 flex items-center justify-between px-3 sm:px-4 shrink-0 z-50">
      {/* Left: Brand & Role */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-emergency-600/20 border border-emergency-500/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="#ef4444" opacity="0.4" stroke="#ef4444" strokeWidth="2"/>
              <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm sm:text-base font-bold tracking-wide text-navy-50 font-sans">
            LIFE<span className="text-emergency-500">LANE</span>
          </span>
        </div>

        {userRole && (
          <div className="flex items-center">
            <Badge variant={roleBadgeVariant[userRole]} size="sm">
              {roleLabels[userRole]}
            </Badge>
          </div>
        )}
      </div>

      {/* Right: Indicators & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {gpsState && (
          <GPSIndicator state={gpsState} accuracy={gpsAccuracy} />
        )}
        <ConnectionIndicator state={connectionState} />
        {userName && userRole && (
          <>
            <div className="w-px h-5 bg-navy-700 hidden sm:block mx-0.5" />
            <AccountMenu userName={userName} userRole={userRole} />
          </>
        )}
      </div>
    </header>
  );
}
