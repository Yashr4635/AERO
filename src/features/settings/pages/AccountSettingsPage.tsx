import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { PageHeader as Header } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export function AccountSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  
  // Unified error handling state instead of multiple toasts
  const [bannerState, setBannerState] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setBannerState(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');

      let { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .eq('id', user.id)
        .single();

      // If the profile does not exist (perhaps trigger failed), gracefully upsert it.
      if (error && error.code === 'PGRST116') {
        const fallbackName = user.user_metadata?.full_name || 'Operator';
        const { data: newData, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fallbackName,
            role: user.user_metadata?.role || 'user'
          })
          .select('id, full_name, email, role, created_at')
          .single();
          
        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      setProfile(data as ProfileData);
    } catch (error: any) {
      console.error(error);
      setBannerState({
        type: 'error',
        message: 'Unable to load operator profile. We couldn\'t retrieve your AERO profile from the database.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setBannerState(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setBannerState({
        type: 'success',
        message: 'Profile updated successfully.'
      });
      
      // Auto-dismiss success after 3 seconds
      setTimeout(() => {
        setBannerState(prev => prev?.type === 'success' ? null : prev);
      }, 3000);

    } catch (error: any) {
      console.error(error);
      setBannerState({
        type: 'error',
        message: 'Unable to update your profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-navy-950 flex flex-col">
        <Header title="AERO OPERATOR PROFILE" subtitle="Manage your AERO operational identity and profile." />
        <div className="flex-1 flex flex-col items-center justify-center text-navy-400 gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-600 border-t-transparent animate-spin"></div>
          <span className="text-sm font-bold tracking-widest uppercase">Loading Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-navy-950 flex flex-col">
      <Header title="AERO OPERATOR PROFILE" subtitle="Manage your AERO operational identity and profile." />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        
        {bannerState && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between shadow-lg ${
            bannerState.type === 'error' 
              ? 'bg-red-950/40 border-red-900 text-red-200' 
              : 'bg-emerald-950/40 border-emerald-900 text-emerald-200'
          }`}>
            <div className="flex items-center gap-3">
              {bannerState.type === 'error' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01"></path></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"></path></svg>
              )}
              <span className="text-sm font-medium">{bannerState.message}</span>
            </div>
            {bannerState.type === 'error' && (
              <button onClick={fetchProfile} className="text-xs font-bold underline hover:text-white transition-colors">
                [Retry]
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Profile Card Header (Left Column) */}
          <div className="lg:col-span-1">
            <div className="bg-navy-900/60 border border-cyan-900/30 rounded-2xl p-6 flex flex-col items-center text-center sticky top-6 shadow-2xl backdrop-blur-sm">
              <div className="w-24 h-24 bg-cyan-950 border border-cyan-700/50 rounded-full flex items-center justify-center text-3xl font-bold text-cyan-400 mb-4 shadow-[0_0_20px_rgba(8,145,178,0.2)]">
                {profile?.full_name.substring(0, 2).toUpperCase() || 'OP'}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{profile?.full_name.toUpperCase()}</h2>
              <p className="text-sm text-cyan-500 font-medium tracking-wide mb-6">
                {(profile?.role || 'Operator').replace('_', ' ').toUpperCase()}
              </p>
              
              <div className="w-full bg-navy-950/80 rounded-xl p-4 border border-navy-800 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-navy-400 uppercase font-bold tracking-wider">Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Sections (Right Column) */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="bg-navy-900/40 border border-navy-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-navy-900/80 px-6 py-4 border-b border-navy-800">
                  <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Operator Identity</h3>
                </div>
                <div className="p-6 grid gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Full Name"
                      value={profile?.full_name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                      required
                      placeholder="e.g. John Doe"
                    />
                    <Input
                      label="Operational Role"
                      value={(profile?.role || '').replace('_', ' ').toUpperCase()}
                      disabled
                      className="bg-navy-950/50 opacity-80"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Email Address"
                      value={profile?.email || ''}
                      disabled
                      className="bg-navy-950/50 opacity-80"
                    />
                    <Input
                      label="User ID"
                      value={profile?.id || ''}
                      disabled
                      className="bg-navy-950/50 opacity-80 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-navy-900/40 border border-navy-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-navy-900/80 px-6 py-4 border-b border-navy-800">
                  <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Account Information</h3>
                </div>
                <div className="p-6 grid gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Account Created"
                      value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                      disabled
                      className="bg-navy-950/50 opacity-80"
                    />
                    {/* Placeholder for future schema fields if added */}
                    <div className="flex flex-col justify-center">
                      <p className="text-[10px] text-navy-500 font-medium uppercase tracking-wider mb-1">Email Verification</p>
                      <p className="text-sm font-medium text-emerald-400">Verified via Supabase Auth</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={saving}
                  className="px-8 shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                >
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </Button>
              </div>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
