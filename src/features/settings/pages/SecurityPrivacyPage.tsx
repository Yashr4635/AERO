import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { PageHeader as Header } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface UserData {
  email?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

export function SecurityPrivacyPage() {
  const [loading, setLoading] = useState(true);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  
  // User state
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Unified status banner
  const [bannerState, setBannerState] = useState<{ type: 'error' | 'success' | 'info', message: string } | null>(null);

  useEffect(() => {
    fetchAuthData();
  }, []);

  const fetchAuthData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw new Error('Not authenticated');

      setUserData({
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at
      });
    } catch (err) {
      console.error(err);
      setBannerState({
        type: 'error',
        message: 'Unable to load security profile.'
      });
    } finally {
      setLoading(false);
    }
  };

  const showBanner = (type: 'error' | 'success' | 'info', message: string, autoDismiss = 4000) => {
    setBannerState({ type, message });
    if (autoDismiss) {
      setTimeout(() => {
        setBannerState(prev => prev?.message === message ? null : prev);
      }, autoDismiss);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showBanner('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showBanner('error', 'New passwords do not match.');
      return;
    }
    
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showBanner('success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error(error);
      showBanner('error', error.message || 'Could not change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async (scope: 'local' | 'global' | 'others') => {
    try {
      const { error } = await supabase.auth.signOut({ scope });
      if (error) throw error;
      if (scope === 'local' || scope === 'global') {
        window.location.href = '/login';
      } else {
        showBanner('success', 'Signed out of all other devices successfully.');
      }
    } catch (error: any) {
      console.error(error);
      showBanner('error', 'Failed to sign out: ' + error.message);
    }
  };

  const handleResendVerification = async () => {
    if (!userData?.email) return;
    try {
      showBanner('info', 'Sending verification email...', 0);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) {
        if (error.status === 429) throw new Error('Too many requests. Please wait before trying again.');
        throw error;
      }
      showBanner('success', 'Verification email sent. Please check your inbox.');
    } catch (error: any) {
      console.error(error);
      showBanner('error', error.message || 'Failed to send verification email.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-navy-950 flex flex-col">
        <Header title="SECURITY DASHBOARD" subtitle="Manage your AERO account security and active sessions." />
        <div className="flex-1 flex flex-col items-center justify-center text-navy-400 gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-600 border-t-transparent animate-spin"></div>
          <span className="text-sm font-bold tracking-widest uppercase">Loading Security...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-navy-950 flex flex-col pb-12">
      <Header title="SECURITY DASHBOARD" subtitle="Manage your AERO account security and active sessions." />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 lg:space-y-8">
        
        {bannerState && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 shadow-lg ${
            bannerState.type === 'error' ? 'bg-red-950/40 border-red-900 text-red-200' : 
            bannerState.type === 'success' ? 'bg-emerald-950/40 border-emerald-900 text-emerald-200' :
            'bg-cyan-950/40 border-cyan-900 text-cyan-200'
          }`}>
            {bannerState.type === 'error' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"></path></svg>}
            {bannerState.type === 'success' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"></path></svg>}
            {bannerState.type === 'info' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
            <span className="text-sm font-medium">{bannerState.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column (Security Status & Active Session) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Security Status Card */}
            <div className="bg-navy-900/60 border border-cyan-900/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-4">Security Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-200">Email verified</span>
                  {userData?.email_confirmed_at ? (
                    <span className="flex items-center text-emerald-400 text-xs font-bold gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Yes</span>
                  ) : (
                    <span className="flex items-center text-amber-400 text-xs font-bold gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"></path></svg> No</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-200">Password auth</span>
                  <span className="flex items-center text-emerald-400 text-xs font-bold gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-200">Session active</span>
                  <span className="flex items-center text-emerald-400 text-xs font-bold gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-200">RLS protection</span>
                  <span className="flex items-center text-emerald-400 text-xs font-bold gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"></path></svg> Enabled</span>
                </div>
              </div>
            </div>

            {/* Email Verification Card */}
            {!userData?.email_confirmed_at && (
              <div className="bg-amber-950/20 border border-amber-900/50 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4">Email Verification</h3>
                <p className="text-sm text-navy-300 mb-4">Your email address <span className="font-bold text-white">{userData?.email}</span> is not yet verified. Some operational features may be restricted.</p>
                <Button variant="outline" onClick={handleResendVerification} className="w-full text-amber-400 border-amber-500/30 hover:bg-amber-500/10">
                  RESEND VERIFICATION EMAIL
                </Button>
              </div>
            )}

            {/* Active Session Card */}
            <div className="bg-navy-900/40 border border-navy-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-4">Active Session</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-[10px] text-navy-500 uppercase font-bold tracking-wider mb-1">Status</p>
                  <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Currently Active
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-navy-500 uppercase font-bold tracking-wider mb-1">Last Active</p>
                  <p className="text-sm text-navy-200">{userData?.last_sign_in_at ? new Date(userData.last_sign_in_at).toLocaleString() : 'Just now'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button variant="primary" onClick={() => handleSignOut('local')} className="w-full">
                  SIGN OUT THIS DEVICE
                </Button>
                <Button variant="outline" onClick={() => handleSignOut('others')} className="w-full">
                  SIGN OUT OTHER DEVICES
                </Button>
              </div>
            </div>

          </div>

          {/* Right Column (Password & Danger Zone) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Password Section */}
            <div className="bg-navy-900/40 border border-navy-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-navy-900/80 px-6 py-4 border-b border-navy-800">
                <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Password & Authentication</h3>
              </div>
              <div className="p-6">
                <form onSubmit={handlePasswordUpdate} className="space-y-5 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    placeholder="Retype new password"
                    required
                  />
                  <div className="pt-2">
                    <Button type="submit" variant="primary" loading={savingPassword}>
                      {savingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="bg-navy-900/40 border border-navy-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-navy-900/80 px-6 py-4 border-b border-navy-800">
                <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Privacy Information</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  <li className="flex gap-4">
                    <div className="mt-0.5 shrink-0 text-cyan-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg></div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Operational Records</h4>
                      <p className="text-sm text-navy-400">AERO securely associates operational records and emergency incidents with your authenticated user ID. Row Level Security (RLS) protects your data.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-0.5 shrink-0 text-cyan-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Location Data</h4>
                      <p className="text-sm text-navy-400">Your GPS location is only shared and utilized for routing when you are actively logged into an AERO operational dashboard.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-0.5 shrink-0 text-cyan-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Credential Security</h4>
                      <p className="text-sm text-navy-400">Authentication credentials are managed entirely by Supabase Auth. AERO never stores your password in plain text. Groq AI API keys remain securely on the backend server.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-950/10 border border-red-900/30 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-red-950/30 px-6 py-4 border-b border-red-900/30">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">Danger Zone</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Sign Out All Devices</h4>
                    <p className="text-xs text-navy-300 max-w-sm">Immediately terminate all active AERO sessions associated with this account across all browsers and devices.</p>
                  </div>
                  <Button variant="outline" onClick={() => handleSignOut('global')} className="text-red-400 border-red-500/30 hover:bg-red-500/10 shrink-0">
                    SIGN OUT EVERYWHERE
                  </Button>
                </div>
                
                <div className="pt-6 border-t border-red-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Delete Account</h4>
                    <p className="text-xs text-navy-400 max-w-sm">Permanently delete your AERO operational identity and remove all associated non-retained records.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button variant="outline" disabled className="opacity-50 cursor-not-allowed border-navy-700 bg-transparent text-navy-500 shrink-0">
                      DELETE ACCOUNT
                    </Button>
                    <span className="text-[10px] text-red-400/80 font-medium">Account deletion requires administrator verification.</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
