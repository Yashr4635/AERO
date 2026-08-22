import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';

export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Parse the URL hash fragment to check for errors returned by Supabase
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          if (params.get('error')) {
            const errCode = params.get('error_code');
            const errDesc = params.get('error_description');
            
            if (errCode === 'otp_expired' || errDesc?.includes('expired')) {
              throw new Error('Email confirmation link has expired or is no longer valid.');
            } else {
              throw new Error(errDesc?.replace(/\+/g, ' ') || 'Authentication failed.');
            }
          }
        }

        // Try to get the session - Supabase's JS library automatically parses the hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          // If no session but no explicit error, maybe it was a magic link click that didn't work right
          throw new Error('No valid session found. Please sign in again.');
        }

        // Successful authentication
        const role = session.user.user_metadata?.role || 'user';
        
        // Redirect to the appropriate dashboard
        switch (role.toLowerCase()) {
          case 'ambulance_operator':
          case 'ambulance':
            navigate('/ambulance', { replace: true });
            break;
          case 'traffic_operator':
          case 'police':
            navigate('/police', { replace: true });
            break;
          case 'hospital_operator':
          case 'hospital':
            navigate('/hospital', { replace: true });
            break;
          case 'admin':
            navigate('/admin', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during authentication.');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-navy-950 p-4">
        <div className="w-16 h-16 rounded-full border-4 border-navy-800 border-t-cyan-500 animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-white">Verifying Authentication...</h2>
        <p className="text-navy-400 mt-2">Please wait while we confirm your credentials.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-navy-950 p-4">
        <div className="w-full max-w-md bg-navy-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 mx-auto flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Authentication Error</h2>
          <p className="text-red-400 mb-8">{error}</p>
          
          <div className="space-y-3">
            <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
              RETURN TO SIGN IN
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate('/register')}>
              REGISTER NEW ACCOUNT
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
