import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ambulance, ShieldAlert, Building2, MonitorCog } from 'lucide-react';
import type { UserRole } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { mockHospitals } from '../../../mock';
import { AuthSidebar } from '../components/AuthSidebar';

interface RegisterPageProps {
  onRegister: (role: string) => void;
}

const ROLES: { role: UserRole; label: string; icon: React.ReactNode; color: string; indicatorColor: string }[] = [
  {
    role: 'AMBULANCE',
    label: 'Ambulance Operator / Paramedic',
    icon: <div className="p-2 rounded-[12px] bg-[rgba(239,68,68,0.12)] flex items-center justify-center"><Ambulance size={24} strokeWidth={1.5} color="#EF4444" /></div>,
    color: 'border-[#EF4444] bg-[rgba(239,68,68,0.08)]',
    indicatorColor: 'bg-gradient-to-b from-[#EF4444] to-[#F97316]',
  },
  {
    role: 'POLICE',
    label: 'Traffic Police Command Officer',
    icon: <div className="p-2 rounded-[12px] bg-[rgba(14,165,233,0.12)] flex items-center justify-center"><ShieldAlert size={24} strokeWidth={1.5} color="#0EA5E9" /></div>,
    color: 'border-[#EF4444] bg-[rgba(239,68,68,0.08)]',
    indicatorColor: 'bg-gradient-to-b from-[#EF4444] to-[#F97316]',
  },
  {
    role: 'HOSPITAL',
    label: 'Hospital ER & Trauma Staff',
    icon: <div className="p-2 rounded-[12px] bg-[rgba(34,197,94,0.12)] flex items-center justify-center"><Building2 size={24} strokeWidth={1.5} color="#22C55E" /></div>,
    color: 'border-[#EF4444] bg-[rgba(239,68,68,0.08)]',
    indicatorColor: 'bg-gradient-to-b from-[#EF4444] to-[#F97316]',
  },
  {
    role: 'ADMIN',
    label: 'Central Operations Administrator',
    icon: <div className="p-2 rounded-[12px] bg-[rgba(249,115,22,0.12)] flex items-center justify-center"><MonitorCog size={24} strokeWidth={1.5} color="#F97316" /></div>,
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

const InputLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
    {children}
  </label>
);

const InputField = ({ ...props }: any) => (
  <input
    {...props}
    className="w-full bg-[#131826] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#94A3B8] transition-all duration-[120ms] focus:outline-none focus:border-[#0EA5E9] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] disabled:opacity-50"
  />
);

export function RegisterPage({ onRegister }: RegisterPageProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'AMBULANCE' as UserRole,
    badgeNumber: '',
    vehicleNumber: '',
    hospitalId: mockHospitals[0].id,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
  const strengthColor = strength < 50 ? '#EF4444' : strength < 75 ? '#F59E0B' : '#22C55E';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if ((formData.password || '').length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
            role: formData.role.toLowerCase(),
            vehicle_number: formData.vehicleNumber,
            badge_number: formData.badgeNumber,
            hospital_id: formData.hospitalId,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      if (data.session) {
        onRegister(data.user?.user_metadata?.role || formData.role);
      } else {
        alert(`Confirmation email sent to ${formData.email}. Please check your inbox.`);
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex bg-[#0B0F1A] animate-fade-in">
      <AuthSidebar />

      {/* Right: Registration Form */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto relative">
        {/* Radial gradient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06)_0,transparent_60%)] pointer-events-none" />

        <div className="w-full max-w-md mx-auto my-auto p-8 bg-[#131826] border border-[#1F2937] rounded-2xl shadow-2xl relative z-10">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-[pulse-soft_2s_ease-in-out_infinite]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">AERO</span>
          </div>

          <h1 className="text-2xl font-bold text-[#F8FAFC] mb-1">Create Operator Account</h1>
          <p className="text-[#94A3B8] text-sm mb-8">Select your operational role to get started</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {ROLES.map(({ role, label, icon, color, indicatorColor }) => {
              const active = formData.role === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setFormData({ ...formData, role }); setError(''); }}
                  className={`
                    relative flex items-center gap-2.5 p-3 rounded-xl border transition-all duration-150 text-left cursor-pointer overflow-hidden
                    ${active
                      ? `${color}`
                      : 'bg-[#131826] border-[#1F2937] hover:border-[#374151] hover:-translate-y-[2px]'
                    }
                  `}
                >
                  {active && <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${indicatorColor}`} />}
                  <div className="shrink-0 scale-75 origin-left">{icon}</div>
                  <span className={`text-xs font-semibold leading-tight ${active ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Role Description */}
          <div className="h-4 mb-6">
            <p key={formData.role} className="text-[11px] text-[#94A3B8] animate-fade-in px-1">
              {ROLE_DESCRIPTIONS[formData.role]}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <InputLabel>Full Name</InputLabel>
              <InputField
                type="text"
                placeholder="e.g. Vikram Joshi / Officer Sharma"
                value={formData.fullName}
                onChange={(e: any) => setFormData({...formData, fullName: e.target.value})}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <InputLabel>Official Email Address</InputLabel>
              <InputField
                type="email"
                placeholder="name@emergency.gov.in or name@hospital.org"
                value={formData.email}
                onChange={(e: any) => setFormData({...formData, email: e.target.value})}
                required
                disabled={isLoading}
              />
            </div>

            {formData.role === 'AMBULANCE' && (
              <div>
                <InputLabel>Ambulance Vehicle Registration Number</InputLabel>
                <InputField
                  type="text"
                  placeholder="e.g. KA-01-EA-1008"
                  value={formData.vehicleNumber}
                  onChange={(e: any) => setFormData({...formData, vehicleNumber: e.target.value})}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {formData.role === 'POLICE' && (
              <div>
                <InputLabel>Police Badge / Officer ID Number</InputLabel>
                <InputField
                  type="text"
                  placeholder="e.g. B-4091"
                  value={formData.badgeNumber}
                  onChange={(e: any) => setFormData({...formData, badgeNumber: e.target.value})}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {formData.role === 'HOSPITAL' && (
              <div>
                <InputLabel>Assigned Hospital Facility</InputLabel>
                <div className="relative">
                  <select
                    value={formData.hospitalId}
                    onChange={(e: any) => setFormData({...formData, hospitalId: e.target.value})}
                    disabled={isLoading}
                    className="w-full bg-[#131826] border border-[#1F2937] rounded-xl px-4 py-3 text-sm text-[#F8FAFC] appearance-none cursor-pointer transition-all duration-[120ms] focus:outline-none focus:border-[#0EA5E9] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] disabled:opacity-50"
                  >
                    {mockHospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.address})</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <InputLabel>Create Password</InputLabel>
                <InputField
                  type="password"
                  placeholder="Min 6 characters..."
                  value={formData.password}
                  onChange={(e: any) => setFormData({...formData, password: e.target.value})}
                  required
                  disabled={isLoading}
                />
                {/* Animated Password Strength Bar */}
                <div className="mt-2 h-1 bg-[#1F2937] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: `${strength}%`,
                      backgroundColor: strengthColor
                    }}
                  />
                </div>
              </div>

              <div>
                <InputLabel>Confirm Password</InputLabel>
                <InputField
                  type="password"
                  placeholder="Re-enter password..."
                  value={confirmPassword}
                  onChange={(e: any) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-xs text-red-400">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <label className="flex items-start gap-2 text-[11px] text-[#94A3B8] pt-2 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 rounded border-[#1F2937] bg-[#131826] text-[#0EA5E9] focus:ring-[#0EA5E9]" />
              <span>I agree to AERO's emergency response protocol & terms of service.</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className={`
                mt-4 w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer
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
                'Create Account & Verify Email'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#94A3B8] mt-6 pt-4 border-t border-[#1F2937]">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-[#0EA5E9] hover:text-[#38bdf8] font-semibold transition-colors">
              SIGN IN
            </button>
          </p>

          <p className="mt-8 text-center text-[11px] text-[#94A3B8] leading-relaxed">
            AERO — Prototype demo. Not affiliated with any government or emergency authority.
          </p>
        </div>
      </div>
    </div>
  );
}
