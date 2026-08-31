import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function RequestAmbulance() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'locating' | 'requesting'>('idle');
  const navigate = useNavigate();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setStatus('locating');

    // Simulate location gathering
    await new Promise(r => setTimeout(r, 1000));
    
    setStatus('requesting');
    
    // Simulate request dispatch
    await new Promise(r => setTimeout(r, 1500));
    
    // In a real app, this would return an emergency ID
    const emergencyId = 'emg-' + Math.random().toString(36).substr(2, 9);
    // Route to hospital discovery first before tracking
    navigate('/hospitals', { state: { emergencyId } });
  };

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-[#111827] flex flex-col p-6">
      <div className="flex-1 flex flex-col max-w-md w-full mx-auto justify-center">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Emergency Assistance</h1>
        <p className="text-[#4B5563] text-base mb-8">
          Request an ambulance immediately. Your location will be securely shared with the nearest available responder.
        </p>

        <form onSubmit={handleRequest} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full bg-white border border-[#D1D5DB] rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-colors"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !phoneNumber}
            className="w-full bg-[#DC2626] text-white font-bold text-lg py-4 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {status === 'locating' ? 'Locating...' : 'Requesting...'}
              </>
            ) : (
              'REQUEST AMBULANCE'
            )}
          </button>
        </form>
        
        <p className="text-xs text-[#6B7280] text-center mt-6">
          By requesting, you agree to share your live GPS location for emergency response routing. AERO is a prototype platform.
        </p>
      </div>
    </div>
  );
}
