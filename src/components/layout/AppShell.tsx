import type { UserRole, ConnectionState, GPSState } from '../../types';
import { StatusBar } from './StatusBar';
import { BottomNav } from './BottomNav';
import { GlobalEmergencyBanner } from '../common/GlobalEmergencyBanner';

interface AppShellProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName?: string;
  connectionState: ConnectionState;
  gpsState?: GPSState;
  gpsAccuracy?: number;
}

export function AppShell({
  children,
  userRole,
  userName,
  connectionState,
  gpsState,
  gpsAccuracy,
}: AppShellProps) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-navy-950 font-sans">
      <StatusBar
        userRole={userRole}
        userName={userName}
        connectionState={connectionState}
        gpsState={gpsState}
        gpsAccuracy={gpsAccuracy}
      />

      <GlobalEmergencyBanner />

      {/* Connection lost banner */}
      {connectionState === 'disconnected' && (
        <div className="bg-emergency-900/90 border-b border-emergency-700/80 px-4 py-1.5 flex items-center justify-between animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emergency-400 animate-pulse" />
            <span className="text-[12px] font-medium text-emergency-200" role="alert">
              Network connection disconnected. Retrying real-time connection...
            </span>
          </div>
        </div>
      )}
      {connectionState === 'reconnecting' && (
        <div className="bg-warning-900/80 border-b border-warning-700/60 px-4 py-1.5 flex items-center gap-2 animate-fade-in shrink-0">
          <span className="w-2 h-2 rounded-full bg-warning-500 animate-pulse-soft shrink-0" aria-hidden="true" />
          <span className="text-[12px] text-warning-200">
            Reconnecting to AERO central network...
          </span>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative min-h-0">
        {children}
      </main>

      <BottomNav role={userRole} />
    </div>
  );
}
