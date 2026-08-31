import { useState } from 'react';
import { Ambulance, ShieldAlert, Building2, MonitorCog } from 'lucide-react';
import type { UserRole } from '../../../types';
import { AuthSidebar } from '../components/AuthSidebar';

import { supabase } from '../../../lib/supabase';

interface LoginPageProps {
  onLogin: (role: string) => void;
}

const ROLES: { role: UserRole; label: string; icon: React.ReactNode; placeholder: string; color: string; indicatorColor: string }[] = [
  {
    role: 'AMBULANCE',
    label: 'Ambulance Driver',
    icon: <div className="p-2 rounded-[12px] bg-[rgba(239,68,68,0.12)] flex items-center justify-center"><Ambulance size={24} strokeWidth={1.5} color="#EF4444" /></div>,
    placeholder: 'driver@ems.gov.in or Vehicle No.',
    color: 'border-[#EF4444] bg-[rgba(239,68,68,0.08)]',
    indicatorColor: 'bg-gradient-to-b from-[#EF4444] to-[#F97316]',
  },
  {
    role: 'POLICE',
    label: 'Traffic Police Officer',
    icon: <div className="p-2 rounded-[12px] bg-[rgba(14,165,233,0.12)] flex items-center justify-center"><ShieldAlert size={24} strokeWidth={1.5} color="#0EA5E9" /></div>,
    placeholder: 'officer@police.gov.in or Badge No.',
    color: 'border-[#EF4444] bg-[rgba(239,68,68,0.08)]',
    indicatorColor: 'bg-gradient-to-b from-[#EF4444] to-[#F97316]',
  },
  {
    role: 'HOSPITAL',
    label: 'Hospital ER Staff',
    icon: <div className="p-2 rounded-[12px] bg-[rgba(34,197,94,0.12)] flex items-center justify-center"><Building2 size={24} strokeWidth={1.5} color="#22C55E" /></div>,
    placeholder: 'er.staff@hospital.org',
    color: 'border-[#EF4444] bg-[rgba(239,68,68,0.08)]',
    indicatorColor: 'bg-gradient-to-b from-[#EF4444] to-[#F97316]',
  },
  {
    role: 'ADMIN',
    label: 'Command Center Admin',
    icon: <div className="p-2 rounded-[12px] bg-[rgba(249,115,22,0.12)] flex items-center justify-center"><MonitorCog size={24} strokeWidth={1.5} color="#F97316" /></div>,
    placeholder: 'admin@aero.city.gov',
    color: 'border-[#EF4444] bg-[rgba(239,68,68,0.08)]',
    indicatorColor: 'bg-gradient-to-b from-[#EF4444] to-[#F97316]',
  },
];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  AMBULANCE: "Live GPS routing, traffic clearance requests, and ETA broadcasting.",
  POLICE: "Approve junction clearance, monitor active emergency corridors.",
  HOSPITAL: "Receive inbound patient telemetry and prepare ER resources.",
  ADMIN: "City-wide fleet overview, analytics, and override controls."
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('AMBULANCE');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const activeRole = ROLES.find(r => r.role === selectedRole)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your ID or email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: password,
      });

      if (error) throw error;
      if (data.user) {
        // Auth success, route based on user_metadata.role or selectedRole fallback
        const role = data.user.user_metadata?.role || selectedRole;
        onLogin(role);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-dvh flex bg-[#0B0F1A] animate-fade-in">
      <AuthSidebar />

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Radial gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06)_0,transparent_60%)] pointer-events-none" />

        <div className="w-full max-w-md bg-[#131826] border border-[#1F2937] p-8 rounded-2xl shadow-2xl relative z-10">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-[pulse-soft_2s_ease-in-out_infinite]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">AERO</span>
          </div>

          <h1 className="text-2xl font-bold text-[#F8FAFC] mb-1">Sign in to your terminal</h1>
          <p className="text-[#94A3B8] text-sm mb-8">Select your operational role and enter your credentials</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {ROLES.map(({ role, label, icon, color, indicatorColor }) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setSelectedRole(role); setError(''); }}
                  className={`
                    relative flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-150 text-left cursor-pointer overflow-hidden
                    ${active
                      ? `${color}`
                      : 'bg-[#131826] border-[#1F2937] hover:border-[#374151] hover:-translate-y-[2px]'
                    }
                  `}
                >
                  {active && <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${indicatorColor}`} />}
                  <div className="shrink-0">{icon}</div>
                  <span className={`text-xs font-semibold leading-tight ${active ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Role Description */}
          <div className="h-4 mb-6">
            <p key={selectedRole} className="text-[11px] text-[#94A3B8] animate-fade-in px-1">
              {ROLE_DESCRIPTIONS[selectedRole]}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 flex items-center gap-2">
                <span className="scale-75 origin-left">{activeRole.icon}</span> {activeRole.label} — ID / Email
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder={activeRole.placeholder}
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError(''); }}
                disabled={isLoading}
                className="w-full bg-[#131826] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8] transition-all duration-[120ms] focus:outline-none focus:border-[#0EA5E9] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your operational password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  disabled={isLoading}
                  className="w-full bg-[#131826] border border-[#1F2937] rounded-xl px-4 py-3 pr-16 text-sm text-[#F8FAFC] placeholder-[#94A3B8] transition-all duration-[120ms] focus:outline-none focus:border-[#0EA5E9] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors cursor-pointer px-1"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-xs text-red-400">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer
                ${isLoading
                  ? 'bg-[#1F2937] text-transparent cursor-not-allowed flex items-center justify-center'
                  : 'bg-gradient-to-br from-[#EF4444] to-[#F97316] text-[#FFFFFF] hover:brightness-110 active:scale-[0.98]'
                }
              `}
            >
              {isLoading ? (
                <svg className="animate-spin w-5 h-5 text-[#F8FAFC]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                `Sign In as ${activeRole.label}`
              )}
            </button>
            
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-[11px] text-[#94A3B8] leading-relaxed">
            AERO is a prototype demonstration platform and is not affiliated with any government emergency service.
          </p>
        </div>
      </div>
    </div>
  );
}
