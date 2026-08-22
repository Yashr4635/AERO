import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';
import { supabase } from '../../../lib/supabase';
import { mockHospitals } from '../../../mock';

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
            role: formData.role.toLowerCase(), // ambulance_operator, etc handled later or just generic
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
        addToast({
          variant: 'success',
          title: 'Registration Initiated',
          message: `Confirmation email sent to ${formData.email}. Please check your inbox and click the link to verify.`,
        });
        // We stay on the page or redirect to login. Redirect to login is usually best.
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-navy-950 font-sans">
      <div className="w-full max-w-lg bg-navy-900 border border-navy-700/80 rounded-2xl p-6 sm:p-8 shadow-modal my-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emergency-600/20 border border-emergency-500/30 mx-auto flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" />
              <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-navy-50">Create Operator Account</h1>
          <p className="text-navy-400 mt-1 text-xs sm:text-sm">Join the AERO Emergency Response Network</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-emergency-900/50 border border-emergency-500/50 text-emergency-200 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Full Name" 
            placeholder="e.g. Vikram Joshi / Officer Sharma"
            value={formData.fullName} 
            onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
            required 
          />

          <Input 
            label="Official Email Address" 
            type="email" 
            placeholder="name@emergency.gov.in or name@hospital.org"
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
          
          <Select
            label="Operational Role"
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value as any})}
            options={[
              { value: 'AMBULANCE', label: '🚑 Ambulance Operator / Paramedic' },
              { value: 'POLICE', label: '👮 Traffic Police Command Officer' },
              { value: 'HOSPITAL', label: '🏥 Hospital ER & Trauma Staff' },
              { value: 'ADMIN', label: '🛡️ Central Operations Administrator' },
            ]}
          />

          {/* Role Specific Fields */}
          {formData.role === 'AMBULANCE' && (
            <Input 
              label="Ambulance Vehicle Registration Number" 
              placeholder="e.g. KA-01-EA-1008"
              value={formData.vehicleNumber || ''} 
              onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})} 
              required 
            />
          )}

          {formData.role === 'POLICE' && (
            <Input 
              label="Police Badge / Officer ID Number" 
              placeholder="e.g. B-4091"
              value={formData.badgeNumber || ''} 
              onChange={(e) => setFormData({...formData, badgeNumber: e.target.value})} 
              required 
            />
          )}

          {formData.role === 'HOSPITAL' && (
            <Select
              label="Assigned Hospital Facility"
              value={formData.hospitalId || mockHospitals[0].id}
              onChange={(e) => setFormData({...formData, hospitalId: e.target.value})}
              options={mockHospitals.map(h => ({ value: h.id, label: `${h.name} (${h.address})` }))}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input 
                label="Create Password" 
                type="password" 
                placeholder="Min 6 characters..."
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required 
              />
              <div className="mt-1.5 flex gap-1 h-1">
                {[25, 50, 75, 100].map(level => (
                  <div 
                    key={level} 
                    className={`flex-1 rounded-full transition-colors ${
                      strength >= level 
                        ? strength < 50 ? 'bg-emergency-500' : strength < 75 ? 'bg-warning-500' : 'bg-success-500' 
                        : 'bg-navy-800'
                    }`} 
                  />
                ))}
              </div>
            </div>

            <Input 
              label="Confirm Password" 
              type="password" 
              placeholder="Re-enter password..."
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-navy-300 pt-1 cursor-pointer">
            <input type="checkbox" required className="mt-0.5 rounded border-navy-700 bg-navy-900 text-primary-500 focus:ring-primary-500" />
            <span>I agree to AERO's emergency response protocol & terms of service.</span>
          </label>

          <Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading} className="mt-4">
            CREATE ACCOUNT & VERIFY EMAIL
          </Button>
        </form>

        <p className="text-center text-xs text-navy-400 mt-6 pt-4 border-t border-navy-800">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-primary-400 hover:text-primary-300 font-semibold">
            SIGN IN
          </button>
        </p>
      </div>
    </div>
  );
}
