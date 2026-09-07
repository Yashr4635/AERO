import { useState } from 'react';
import type { UserRole } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin: (role: string) => void;
}

const ROLES: { role: UserRole; label: string; sublabel: string; color: string; activeBg: string; activeBorder: string }[] = [
  {
    role: 'AMBULANCE',
    label: 'Ambulance',
    sublabel: 'Paramedic / Driver',
    color: 'text-[#E53935]',
    activeBg: 'bg-[#E53935]/10',
    activeBorder: 'border-[#E53935]/50',
  },
  {
    role: 'POLICE',
    label: 'Traffic Police',
    sublabel: 'Traffic Authority',
    color: 'text-[#FFB020]',
    activeBg: 'bg-[#FFB020]/10',
    activeBorder: 'border-[#FFB020]/50',
  },
  {
    role: 'HOSPITAL',
    label: 'Hospital ER',
    sublabel: 'Clinical Staff',
    color: 'text-[#20C997]',
    activeBg: 'bg-[#20C997]/10',
    activeBorder: 'border-[#20C997]/50',
  },
  {
    role: 'ADMIN',
    label: 'Command Center',
    sublabel: 'Administrator',
    color: 'text-[#19C6D8]',
    activeBg: 'bg-[#19C6D8]/10',
    activeBorder: 'border-[#19C6D8]/50',
  },
];

const ROLE_PLACEHOLDERS: Record<UserRole, string> = {
  AMBULANCE: 'driver@ems.gov.in',
  POLICE: 'officer@police.gov.in',
  HOSPITAL: 'er.staff@hospital.org',
  ADMIN: 'admin@aero.city.gov',
};

// SVG icons for each role
const RoleIcons: Record<UserRole, React.ReactNode> = {
  AMBULANCE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  POLICE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  HOSPITAL: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M12 8v8M8 12h8"/>
    </svg>
  ),
  ADMIN: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>('AMBULANCE');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // DEMO MODE: Bypass Supabase Auth completely
    setTimeout(() => {
      onLogin(selectedRole);
      setIsLoading(false);
    }, 600); // Small fake delay for UX
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-screen flex bg-bg-main font-sans" style={{ colorScheme: 'dark' }}
    >

      {/* ── LEFT: Cinematic image panel ── */}
      <div className="hidden lg:flex flex-col w-[520px] shrink-0 relative overflow-hidden">
        {/* Hero Image */}
        <motion.div
          initial={{ scale: 1.04 }}
          animate={{ scale: 1, x: [0, 3, 0], y: [0, 2, 0] }}
          transition={{
            scale: { duration: 1.4, ease: 'easeOut' },
            x: { duration: 18, repeat: Infinity, ease: 'linear' },
            y: { duration: 22, repeat: Infinity, ease: 'linear' }
          }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src="/corridor_clearing.jpg"
            alt="Traffic police clearing emergency corridor"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
        {/* Dark cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090C] via-[#07090C]/70 to-[#07090C]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#07090C]/40" />

        {/* Content over the image */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E53935] flex items-center justify-center shadow-[0_0_20px_rgba(229,57,53,0.4)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="white" opacity="0.95"/>
                <path d="M9 12h6M12 9v6" stroke="#07090C" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-xl leading-none tracking-tight">AERO</p>
              <p className="text-white/50 font-bold text-[9px] uppercase tracking-[0.2em] mt-0.5">Emergency Response Network</p>
            </div>
          </motion.div>

          {/* Bottom copy */}
          <div className="mt-auto">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4"
            >
              Active Status
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-3xl font-black text-white leading-tight mb-4"
            >
              Every second<br/>matters.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-white/60 text-sm font-medium leading-relaxed max-w-xs"
            >
              Connecting ambulances, traffic authorities and hospitals through one real-time coordination platform.
            </motion.p>

            {/* Status indicators */}
            <div className="mt-8 space-y-3">
              {[
                { label: 'Live Response Network', status: 'ONLINE', color: '#20C997', delay: 0 },
                { label: 'Traffic Authority Link', status: 'ACTIVE', color: '#20C997', delay: 0.8 },
                { label: 'Hospital ER Bridge', status: 'READY', color: '#20C997', delay: 1.6 },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1), duration: 0.5 }}
                  className="flex items-center justify-between border border-white/10 rounded-lg px-4 py-2.5 bg-white/5 backdrop-blur-sm"
                >
                  <span className="text-white/70 text-xs font-medium">{item.label}</span>
                  <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: item.color }}>
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      animate={{ opacity: [1, 0.45, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
                    />
                    {item.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Authentication panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 bg-bg-surface relative">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#E53935] flex items-center justify-center shadow-[0_0_16px_rgba(229,57,53,0.4)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="white"/>
                <path d="M9 12h6M12 9v6" stroke="#07090C" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-black text-xl tracking-tight">AERO</span>
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.3, ease: 'easeOut' }}
              className="mb-8"
            >
              <p className="text-[#A7ADB5] text-xs font-bold uppercase tracking-widest mb-2 transition-colors focus-within:text-white">Operator Sign In</p>
              <h2 className="text-2xl font-black text-white tracking-tight">Access AERO</h2>
            </motion.div>

            {/* Role Selection */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
              className="mb-6"
            >
              <p className="text-xs font-bold text-[#A7ADB5] uppercase tracking-widest mb-3">Select Role</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(({ role, label, sublabel, color, activeBg, activeBorder }) => {
                  const active = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => { setSelectedRole(role); setError(''); }}
                      className={`
                        group relative flex items-center gap-2.5 p-3 rounded-xl border transition duration-200 text-left cursor-pointer
                        hover:-translate-y-[1px] hover:scale-[1.01]
                        ${active
                          ? `${activeBg} ${activeBorder} ${color}`
                          : 'bg-[#0F1218] border-[rgba(255,255,255,0.06)] text-[#A7ADB5] hover:border-[rgba(255,255,255,0.12)] hover:text-white hover:bg-white/[0.02]'
                        }
                      `}
                    >
                      <span className={`shrink-0 transition-transform duration-200 group-hover:translate-x-[1px] ${active ? color : ''}`}>
                        {RoleIcons[role]}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold leading-tight transition-colors ${active ? color : 'text-text-primary'}`}>{label}</p>
                        <p className={`text-[9px] font-medium mt-0.5 truncate transition-colors ${active ? 'opacity-70' : 'text-text-secondary'}`}>{sublabel}</p>
                      </div>
                      {active && (
                        <motion.div
                          layoutId="activeRoleDot"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/20 rounded-xl px-4 py-3 text-sm text-[#E53935] font-medium overflow-hidden"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3, ease: 'easeOut' }}
                className="group"
              >
                <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">
                  Operator ID / Email
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  placeholder={ROLE_PLACEHOLDERS[selectedRole]}
                  value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setError(''); }}
                  disabled={isLoading}
                  className="enterprise-input disabled:opacity-50 focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
                className="group"
              >
                <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    disabled={isLoading}
                    className="enterprise-input pr-16 disabled:opacity-50 focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#A7ADB5] hover:text-white transition-colors uppercase tracking-widest px-1"
                  >
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={showPassword ? 'hide' : 'show'}
                        initial={{ opacity: 0, y: 2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ duration: 0.15 }}
                        className="block"
                      >
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3, ease: 'easeOut' }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-2 rounded-xl text-sm font-black tracking-widest uppercase transition duration-200 bg-[#E53935] text-white hover:bg-[#ef5350] hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(229,57,53,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        AUTHENTICATING...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="default"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="block"
                      >
                        Sign In to AERO
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
              className="mt-6 flex items-center justify-center gap-2 text-sm text-[#A7ADB5] font-medium"
            >
              <span>No account?</span>
              <button onClick={() => navigate('/register')} className="font-bold text-[#E53935] hover:text-[#ef5350] transition-colors">
                Request Access
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="mt-6 pt-6 border-t border-border-subtle"
            >
              <p className="text-center text-[11px] font-medium text-[#A7ADB5]/60 leading-relaxed">
                For authorized AERO operators only.
              </p>
            </motion.div>
          </div>
          </div>
      </div>
    </motion.div>
  );
}
