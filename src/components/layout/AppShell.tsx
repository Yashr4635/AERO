import type { UserRole, ConnectionState, GPSState } from '../../types';
import { StatusBar } from './StatusBar';
import { BottomNav } from './BottomNav';
import { GlobalEmergencyBanner } from '../common/GlobalEmergencyBanner';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="flex flex-col h-dvh overflow-hidden bg-bg-main font-sans">
      <StatusBar
        userRole={userRole}
        userName={userName}
        connectionState={connectionState}
        gpsState={gpsState}
        gpsAccuracy={gpsAccuracy}
      />

      <GlobalEmergencyBanner />

      {/* Connection Banners */}
      <AnimatePresence>
        {connectionState === 'disconnected' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#E53935]/10 border-b border-[#E53935]/20 px-4 py-1.5 flex items-center justify-between shrink-0 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[12px] font-medium text-[#E53935]" role="alert">
                Network connection disconnected. Retrying real-time connection...
              </span>
            </div>
          </motion.div>
        )}
        {connectionState === 'reconnecting' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#FFB020]/10 border-b border-[#FFB020]/20 px-4 py-1.5 flex items-center gap-2 shrink-0 overflow-hidden"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse-soft shrink-0" aria-hidden="true" />
            <span className="text-[12px] text-[#FFB020] font-medium">
              Reconnecting to AERO central network...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative min-h-0 bg-bg-main">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </main>

      <BottomNav role={userRole} />
    </div>
  );
}
