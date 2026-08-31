import { Ambulance, Activity, ShieldAlert } from 'lucide-react';

export function AuthSidebar() {
  return (
    <div className="hidden lg:flex flex-col justify-between w-[460px] bg-[#131826] border-r border-[#1F2937] p-10 shrink-0 relative overflow-hidden">
      {/* Subtle animated grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#F8FAFC 1px, transparent 1px), linear-gradient(90deg, #F8FAFC 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* Floating background elements */}
      <div className="absolute top-[20%] right-[10%] opacity-[0.03] text-white animate-[float_6s_ease-in-out_infinite]">
        <Ambulance size={120} strokeWidth={1} />
      </div>
      <div className="absolute top-[60%] -left-[10%] opacity-[0.02] text-white animate-[float-delayed_8s_ease-in-out_infinite]">
        <ShieldAlert size={160} strokeWidth={1} />
      </div>

      {/* Decorative radar sweep in background */}
      <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] opacity-[0.03] rounded-full border border-white/20">
        <div className="absolute inset-0 rounded-full border border-white/20 scale-75" />
        <div className="absolute inset-0 rounded-full border border-white/20 scale-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(255,255,255,1)_360deg)] animate-[radar-sweep_8s_linear_infinite] rounded-full pointer-events-none origin-center" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-[#EF4444] flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-[pulse-glow_2s_ease-in-out_infinite] relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="white" opacity="0.2"/>
              <path d="M9 12h6M12 9v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none tracking-tight">AERO</p>
            <p className="text-white/40 text-[11px] leading-none mt-0.5">EMERGENCY OPERATIONS</p>
          </div>
        </div>

        {/* Hero Text */}
        <h2 className="text-3xl font-bold text-white leading-snug mb-3">
          Real-time emergency<br />corridor coordination
        </h2>
        <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-sm">
          Connecting ambulance drivers, traffic police, and hospitals for seamless green-wave emergency response across the city.
        </p>

        {/* Live Status Widget */}
        <div className="bg-[#0B0F1A]/80 backdrop-blur border border-[#1F2937] rounded-xl p-4 mb-10 inline-flex flex-col gap-3 max-w-xs shadow-lg shadow-black/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-bold text-[#F8FAFC] tracking-wide uppercase">System Active</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[10px] text-[#94A3B8] font-semibold uppercase mb-0.5">Units</p>
              <p className="text-sm font-mono font-bold text-white flex items-center gap-1.5"><Ambulance size={14} className="text-[#0EA5E9]" /> 3 Active</p>
            </div>
            <div className="w-px h-8 bg-[#1F2937]" />
            <div>
              <p className="text-[10px] text-[#94A3B8] font-semibold uppercase mb-0.5">Avg Response</p>
              <p className="text-sm font-mono font-bold text-white flex items-center gap-1.5"><Activity size={14} className="text-[#EF4444]" /> 8.2 min</p>
            </div>
          </div>
        </div>

        {/* Feature list */}
        <div className="space-y-6 mt-auto relative z-10 mb-8">
          {[
            { icon: '📍', title: 'Smart Discovery', text: 'Automatic nearest hospital detection from live GPS' },
            { icon: '🛣️', title: 'Live Routing', text: 'Live OSRM route with police junction clearance' },
            { icon: '📡', title: 'Cross-tab Sync', text: 'Real-time state synchronisation between units' },
            { icon: '🚦', title: 'Green Wave', text: 'Traffic coordination & SOS dispatch' },
          ].map((f, i) => (
            <div key={f.title} className="flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}>
              <div className="w-10 h-10 rounded-lg bg-[#1F2937]/50 border border-[#374151]/50 flex items-center justify-center shrink-0 text-lg">
                {f.icon}
              </div>
              <div>
                <h4 className="text-white text-sm font-bold mb-0.5">{f.title}</h4>
                <p className="text-white/50 text-xs leading-relaxed max-w-[260px]">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer Disclaimer */}
      <div className="relative z-10 mt-6 pt-6 border-t border-[#1F2937]">
        <p className="text-[#64748B] text-[10px] leading-relaxed">
          AERO — Prototype demo. Not affiliated with any government or emergency authority. For demonstration purposes only.
        </p>
      </div>
    </div>
  );
}
