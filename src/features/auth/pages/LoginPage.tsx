import { useState } from 'react';
import type { UserRole } from '../../../types';

import { supabase } from '../../../lib/supabase';

interface LoginPageProps {
  onLogin: (role: string) => void;
}

const ROLES: { role: UserRole; label: string; icon: string; placeholder: string; color: string }[] = [
  {
    role: 'AMBULANCE',
    label: 'Ambulance Driver',
    icon: '🚑',
    placeholder: 'driver@ems.gov.in or Vehicle No.',
    color: 'from-red-600/20 to-rose-600/10 border-red-500/40',
  },
  {
    role: 'POLICE',
    label: 'Traffic Police Officer',
    icon: '👮',
    placeholder: 'officer@police.gov.in or Badge No.',
    color: 'from-blue-600/20 to-indigo-600/10 border-blue-500/40',
  },
  {
    role: 'HOSPITAL',
    label: 'Hospital ER Staff',
    icon: '🏥',
    placeholder: 'er.staff@hospital.org',
    color: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/40',
  },
  {
    role: 'ADMIN',
    label: 'Command Center Admin',
    icon: '🛡️',
    placeholder: 'admin@aero.city.gov',
    color: 'from-amber-600/20 to-yellow-600/10 border-amber-500/40',
  },
];

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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    }
  };

  return (
    <div className="min-h-dvh flex bg-[#0a0d14]">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-gradient-to-b from-[#0d111c] to-[#080b13] border-r border-white/5 p-10 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="white" opacity="0.2"/>
                <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none tracking-tight">AERO</p>
              <p className="text-white/40 text-[11px] leading-none mt-0.5">EMERGENCY OPERATIONS</p>
            </div>
          </div>

          {/* Hero Text */}
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Real-time emergency<br />corridor coordination
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Connecting ambulance drivers, traffic police, and hospitals for seamless green-wave emergency response across the city.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-4">
          {[
            { icon: '📍', text: 'Automatic nearest hospital detection from live GPS' },
            { icon: '🛣️', text: 'Live OSRM route with police junction clearance' },
            { icon: '📡', text: 'Real-time cross-tab synchronisation between units' },
            { icon: '🚦', text: 'Green-wave traffic coordination & SOS dispatch' },
          ].map(f => (
            <div key={f.text} className="flex items-start gap-3">
              <span className="text-lg mt-0.5 shrink-0">{f.icon}</span>
              <p className="text-white/50 text-xs leading-relaxed">{f.text}</p>
            </div>
          ))}
          <p className="text-white/20 text-[10px] pt-2 border-t border-white/5">
            AERO v2.0 · Government Emergency Services Platform
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">AERO</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Sign in to your terminal</h1>
          <p className="text-white/40 text-sm mb-8">Select your operational role and enter your credentials</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {ROLES.map(({ role, label, icon, color }) => {
              const active = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setSelectedRole(role); setError(''); }}
                  className={`
                    relative flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left cursor-pointer
                    ${active
                      ? `bg-gradient-to-br ${color} shadow-sm`
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                    }
                  `}
                >
                  <span className="text-xl shrink-0">{icon}</span>
                  <span className={`text-xs font-semibold leading-tight ${active ? 'text-white' : 'text-white/60'}`}>
                    {label}
                  </span>
                  {active && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                {activeRole.icon} &nbsp;{activeRole.label} — ID / Email
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder={activeRole.placeholder}
                value={identifier}
                onChange={e => { setIdentifier(e.target.value); setError(''); }}
                disabled={isLoading}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
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
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 pr-16 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all disabled:opacity-50"
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
                w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer
                ${isLoading
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40 active:scale-[0.99]'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating…
                </span>
              ) : (
                `Sign In as ${activeRole.label}`
              )}
            </button>
            
            <div className="flex items-center gap-4 my-4 opacity-50">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer bg-white text-black hover:bg-gray-200 active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-[11px] text-white/20 leading-relaxed">
            This system is for authorised emergency services personnel only.<br />
            Unauthorised access is prohibited under applicable law.
          </p>
        </div>
      </div>
    </div>
  );
}
