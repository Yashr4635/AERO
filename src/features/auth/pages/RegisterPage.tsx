import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../components/ui/Toast';
import { supabase } from '../../../lib/supabase';
import { mockHospitals } from '../../../mock';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from '../../../components/ui/Drawer';
import { EmergencyProtocolContent, TermsOfServiceContent } from '../../public/components/LegalContent';

interface RegisterPageProps {
  onRegister: (role: string) => void;
}

export function RegisterPage({ onRegister }: RegisterPageProps) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'AMBULANCE',
    badgeNumber: '',
    vehicleNumber: '',
    hospitalId: mockHospitals[0].id,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Drawer state
  const [legalDrawerOpen, setLegalDrawerOpen] = useState(false);
  const [legalDrawerType, setLegalDrawerType] = useState<'protocol' | 'terms'>('protocol');

  const calculatePasswordStrength = (pass: string) => {
    if (pass.length === 0) return 0;
    if (pass.length < 6) return 25;
    let strength = 25;
    if (/[A-Z]/.test(pass)) strength += 25;
    if (/[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return Math.min(100, strength);
  };

  const strength = calculatePasswordStrength(formData.password || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    // DEMO MODE: Bypass Supabase Auth completely
    setTimeout(() => {
      onRegister(formData.role);
      setIsLoading(false);
    }, 600); // Small fake delay for UX
  };

  const strengthColor = strength < 50 ? '#E53935' : strength < 75 ? '#FFB020' : '#20C997';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="min-h-screen flex bg-bg-main font-sans" style={{ colorScheme: 'dark' }}
    >

      {/* ── LEFT: Cinematic image panel ── */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden">
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
            src="/hospital_arrival.jpg"
            alt="Ambulance arriving at emergency hospital"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090C] via-[#07090C]/75 to-[#07090C]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#07090C]/30" />

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

          <div className="mt-auto">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4"
            >
              Operator Onboarding
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-3xl font-black text-white leading-tight mb-4"
            >
              Join the<br/>response network.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-white/60 text-sm font-medium leading-relaxed max-w-xs"
            >
              Register as an ambulance operator, traffic authority, hospital staff, or command center administrator.
            </motion.p>

            {/* Role indicators */}
            <div className="mt-8 grid grid-cols-2 gap-2">
              {[
                { label: 'Ambulance Units', color: '#E53935' },
                { label: 'Traffic Police', color: '#FFB020' },
                { label: 'Hospital ER', color: '#20C997' },
                { label: 'Command Center', color: '#19C6D8' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1), duration: 0.5 }}
                  className="flex items-center gap-2 border border-white/10 rounded-lg px-3 py-2 bg-white/5 backdrop-blur-sm"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Registration panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-12 bg-bg-surface relative overflow-y-auto">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md py-6">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
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
              className="mb-7"
            >
              <p className="text-[#A7ADB5] text-xs font-bold uppercase tracking-widest mb-2 transition-colors focus-within:text-white">New Operator</p>
              <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/20 rounded-xl px-4 py-3 text-sm text-[#E53935] font-medium overflow-hidden"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease: 'easeOut' }}
                className="group"
              >
                <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Joshi / Officer Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  required
                  className="enterprise-input focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                />
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3, ease: 'easeOut' }}
                className="group"
              >
                <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">Official Email</label>
                <input
                  type="email"
                  placeholder="name@emergency.gov.in"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="enterprise-input focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                />
              </motion.div>

              {/* Operational Role */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
                className="group"
              >
                <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">Operational Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="enterprise-input appearance-none cursor-pointer focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                >
                  <option value="AMBULANCE">Ambulance Operator / Paramedic</option>
                  <option value="POLICE">Traffic Police Command Officer</option>
                  <option value="HOSPITAL">Hospital ER & Trauma Staff</option>
                  <option value="ADMIN">Central Operations Administrator</option>
                </select>
              </motion.div>

              {/* Role Specific Fields */}
              <AnimatePresence mode="popLayout">
                {formData.role === 'AMBULANCE' && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="group">
                    <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">Vehicle Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. KA-01-EA-1008"
                      value={formData.vehicleNumber || ''}
                      onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                      required
                      className="enterprise-input focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                    />
                  </motion.div>
                )}

                {formData.role === 'POLICE' && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="group">
                    <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">Police Badge Number</label>
                    <input
                      type="text"
                      placeholder="e.g. B-4091"
                      value={formData.badgeNumber || ''}
                      onChange={(e) => setFormData({...formData, badgeNumber: e.target.value})}
                      required
                      className="enterprise-input focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                    />
                  </motion.div>
                )}

                {formData.role === 'HOSPITAL' && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="group">
                    <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">Assigned Hospital Facility</label>
                    <select
                      value={formData.hospitalId || mockHospitals[0].id}
                      onChange={(e) => setFormData({...formData, hospitalId: e.target.value})}
                      className="enterprise-input appearance-none cursor-pointer focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                    >
                      {mockHospitals.map(h => (
                        <option key={h.id} value={h.id}>{h.name} ({h.address})</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Passwords */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3, ease: 'easeOut' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="group">
                  <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">Create Password</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    className="enterprise-input focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                  />
                  {/* Password strength */}
                  <div className="mt-2 flex gap-1 h-1">
                    {[25, 50, 75, 100].map(level => (
                      <div
                        key={level}
                        className="flex-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: strength >= level ? strengthColor : 'rgba(255,255,255,0.08)' }}
                      />
                    ))}
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-bold text-[#A7ADB5] uppercase tracking-widest mb-2 transition-colors group-focus-within:text-white">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="enterprise-input focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935]/30 focus:shadow-[0_0_15px_rgba(229,57,53,0.15)] transition duration-200"
                  />
                </div>
              </motion.div>

              {/* Terms */}
              <motion.label
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
                className="flex items-start gap-3 mt-2 cursor-pointer group"
              >
                <div className="relative mt-0.5 flex items-center justify-center w-4 h-4 rounded border border-border-subtle bg-[#0F1218] transition-colors group-hover:border-[#E53935]/50 overflow-hidden shrink-0">
                  <input
                    type="checkbox"
                    required
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <AnimatePresence>
                    {agreed && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute inset-0 bg-[#E53935] flex items-center justify-center"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-xs text-[#A7ADB5] leading-relaxed group-hover:text-text-primary transition-colors">
                  I agree to AERO's{' '}
                  <button type="button" onClick={(e) => { e.preventDefault(); setLegalDrawerType('protocol'); setLegalDrawerOpen(true); }} className="font-bold text-[#E53935] hover:text-[#ef5350]">emergency response protocol</button>
                  {' '}&{' '}
                  <button type="button" onClick={(e) => { e.preventDefault(); setLegalDrawerType('terms'); setLegalDrawerOpen(true); }} className="font-bold text-[#E53935] hover:text-[#ef5350]">terms of service</button>.
                </span>
              </motion.label>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3, ease: 'easeOut' }}
              >
                <button
                  type="submit"
                  disabled={isLoading || !agreed}
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
                        CREATING OPERATOR...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="default"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="block"
                      >
                        Create Account & Verify Email
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="mt-6 pt-6 border-t border-border-subtle text-center"
            >
              <span className="text-sm text-[#A7ADB5] font-medium">Already have an account? </span>
              <button onClick={() => navigate('/login')} className="font-bold text-[#E53935] hover:text-[#ef5350] transition-colors text-sm">
                Sign In
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Legal Drawer */}
      <Drawer
        open={legalDrawerOpen}
        onClose={() => setLegalDrawerOpen(false)}
        position="right"
      >
        <div className="h-full flex flex-col bg-[#070A0F] text-[#F4F7FA]">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
            <h2 className="text-xl font-bold tracking-tight text-white">
              {legalDrawerType === 'protocol' ? 'Emergency Protocol' : 'Terms of Service'}
            </h2>
            <button
              onClick={() => setLegalDrawerOpen(false)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#A7ADB5] hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="prose prose-invert prose-red max-w-none text-sm text-[#A7ADB5] space-y-6">
              {legalDrawerType === 'protocol' ? <EmergencyProtocolContent /> : <TermsOfServiceContent />}
            </div>
          </div>
          
          {/* Drawer Footer */}
          <div className="p-6 border-t border-white/[0.08] bg-[#0B0D10]">
            <button
              type="button"
              onClick={() => {
                setAgreed(true);
                setLegalDrawerOpen(false);
              }}
              className="w-full py-3 bg-[#E53935] text-white rounded-lg font-bold text-sm hover:bg-[#ef5350] transition-colors"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </Drawer>
    </motion.div>
  );
}
