import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { audioAlert } from '../../../utils/audioAlert';
import { authService } from '../services/authService';

interface VerifyEmailPageProps {
  onVerified?: (user: { username: string; role: string }) => void;
}

export function VerifyEmailPage({ onVerified }: VerifyEmailPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const userState = location.state || {};
  const email = userState.email || '';
  const role = userState.role || 'AMBULANCE';
  const fullName = userState.fullName || 'Operator';

  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'resending'>('idle');

  const handleVerify = async (codeToVerify: string = otp) => {
    if (!codeToVerify.trim()) {
      addToast({ variant: 'error', title: 'Code Required', message: 'Please enter the 6-digit verification code sent to your email.' });
      return;
    }

    setStatus('verifying');
    try {
      await authService.verifyEmail(codeToVerify);
      setStatus('verified');
      audioAlert.playSuccessChime();

      addToast({
        variant: 'success',
        title: 'Email Verified Successfully',
        message: `Welcome, ${fullName}! Launching your ${role} dashboard...`,
      });

      setTimeout(() => {
        if (onVerified) {
          onVerified({ username: email, role });
        } else {
          switch (role) {
            case 'AMBULANCE':
              navigate('/ambulance');
              break;
            case 'POLICE':
              navigate('/police');
              break;
            case 'HOSPITAL':
              navigate('/hospital');
              break;
            case 'ADMIN':
              navigate('/admin');
              break;
            default:
              navigate('/ambulance');
          }
        }
      }, 1000);
    } catch {
      setStatus('idle');
      addToast({ variant: 'error', title: 'Verification Failed', message: 'Invalid or expired verification code.' });
    }
  };

  const handleResend = async () => {
    setStatus('resending');
    try {
      await authService.resendVerification(email);
      setStatus('idle');
      addToast({
        variant: 'info',
        title: 'Verification Link Resent',
        message: `A fresh verification code was sent to ${email}.`,
      });
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-navy-950 font-sans">
      <div className="w-full max-w-md bg-navy-900 border border-navy-700/80 rounded-2xl p-6 sm:p-8 shadow-modal text-center">
        
        {/* Animated Icon */}
        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 border transition-all ${
          status === 'verified'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            : 'bg-info-500/10 border-info-500/20 text-info-400'
        }`}>
          {status === 'verified' ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-bounce">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-navy-50 mb-2">
          {status === 'verified' ? 'Email Verified!' : 'Check your email'}
        </h1>
        
        <p className="text-navy-300 text-xs sm:text-sm mb-6 leading-relaxed">
          {status === 'verified' ? (
            <span className="text-emerald-400 font-semibold">Account successfully verified. Redirecting to your operational terminal...</span>
          ) : (
            <>
              We've sent a 6-digit verification code to <span className="font-semibold text-white">{email || 'your registered address'}</span>. 
              Please enter the code to activate your account.
            </>
          )}
        </p>

        {status !== 'verified' && (
          <div className="space-y-4">
            {/* OTP Code Entry */}
            <div className="bg-navy-950 p-3.5 rounded-xl border border-navy-800 space-y-2">
              <label className="block text-[11px] font-bold text-navy-400 uppercase tracking-wider">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center font-mono text-xl tracking-[0.3em] font-bold py-2 bg-navy-900 border border-navy-700 rounded-lg text-emerald-400 focus:border-emerald-500 outline-none"
                placeholder="------"
                autoFocus
              />
            </div>

            <div className="space-y-2.5">
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                onClick={() => handleVerify(otp)}
                loading={status === 'verifying'}
              >
                VERIFY CODE & CONTINUE
              </Button>
              
              <Button 
                variant="outline" 
                size="md" 
                fullWidth 
                onClick={handleResend}
                loading={status === 'resending'}
              >
                RESEND VERIFICATION CODE
              </Button>
            </div>
          </div>
        )}

        <button 
          onClick={() => navigate('/register')}
          className="mt-6 text-xs text-navy-400 hover:text-navy-200 transition-colors cursor-pointer"
        >
          Use a different email address
        </button>
      </div>
    </div>
  );
}

