import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

interface LoginPageProps {
  onLogin: (username: string, password: string, role: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !role) {
      setError('All fields are required');
      return;
    }
    setError('');
    setLoading(true);
    // Mock login delay
    setTimeout(() => {
      setLoading(false);
      onLogin(username, password, role);
    }, 1000);
  };

  return (
    <div className="min-h-dvh bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="#06b6d4" opacity="0.2" stroke="#06b6d4" strokeWidth="1.5"/>
              <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h1 className="text-2xl font-bold tracking-wide text-navy-50">
              LIFE<span className="text-info-400">LANE</span>
            </h1>
          </div>
          <p className="text-sm text-navy-400">
            Emergency Ambulance Traffic Clearance System
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-navy-800 border border-navy-600/50 rounded-[12px] p-6 shadow-card space-y-4">
          <h2 className="text-base font-semibold text-navy-100 mb-1">Sign In</h2>
          <p className="text-[13px] text-navy-400 mb-4">Access your emergency response dashboard.</p>

          {error && (
            <div className="bg-emergency-900/40 border border-emergency-700/50 rounded-[6px] px-3 py-2 text-[13px] text-emergency-300" role="alert">
              {error}
            </div>
          )}

          <Input
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            }
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            }
          />

          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Select your role"
            options={[
              { value: 'AMBULANCE', label: 'Ambulance Operator' },
              { value: 'POLICE', label: 'Traffic Police' },
              { value: 'ADMIN', label: 'Administrator' },
            ]}
          />

          <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-[11px] text-navy-500 mt-6">
          AERO v1.0 — Emergency Response System
        </p>
      </div>
    </div>
  );
}
