import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export function LandingPage() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll state for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll function
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-dvh bg-navy-950 text-navy-50 flex flex-col font-sans selection:bg-emergency-500/30">
      {/* ── HEADER ── */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-navy-950/90 backdrop-blur-md border-b border-navy-800 shadow-lg' 
            : 'bg-transparent border-b border-transparent'
        } px-6 py-4`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-lg bg-emergency-600 flex items-center justify-center shadow-lg shadow-emergency-900/50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">AERO</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-navy-300">
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">
              How It Works
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('vision')} className="hover:text-white transition-colors cursor-pointer">
              Future Vision
            </button>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')} className="text-navy-200 hover:text-white hover:bg-navy-800">
              SIGN IN
            </Button>
            <Button variant="primary" onClick={() => navigate('/register')} className="bg-emergency-600 hover:bg-emergency-500 text-white shadow-lg shadow-emergency-900/40">
              GET STARTED
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-navy-200 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-navy-950 pt-24 px-6 md:hidden flex flex-col gap-6">
          <nav className="flex flex-col gap-6 text-lg font-medium text-navy-200">
            <button onClick={() => scrollToSection('how-it-works')} className="text-left hover:text-white transition-colors">How It Works</button>
            <button onClick={() => scrollToSection('features')} className="text-left hover:text-white transition-colors">Features</button>
            <button onClick={() => scrollToSection('vision')} className="text-left hover:text-white transition-colors">Future Vision</button>
          </nav>
          <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-navy-800">
            <Button variant="outline" onClick={() => navigate('/login')} className="w-full justify-center">SIGN IN</Button>
            <Button variant="primary" onClick={() => navigate('/register')} className="w-full justify-center bg-emergency-600">GET STARTED</Button>
          </div>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6 relative overflow-hidden flex flex-col items-center">
        {/* Abstract map/grid background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emergency-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Hero Content */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emergency-900/40 border border-emergency-500/30 text-emergency-400 text-xs font-bold tracking-wider uppercase mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emergency-500 animate-pulse" />
              LIVE EMERGENCY ROUTING
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-white">
              Every Second Matters.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emergency-400 via-rose-400 to-orange-400">
                Make Every Route Count.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-navy-300 mb-10 max-w-2xl leading-relaxed">
              AERO coordinates ambulances, traffic-response teams, and hospitals through real-time location intelligence, route optimization, and emergency coordination.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button size="xl" onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 bg-emergency-600 hover:bg-emergency-500 text-white shadow-lg shadow-emergency-900/40">
                START EMERGENCY ROUTING
              </Button>
              <Button variant="outline" size="xl" onClick={() => scrollToSection('how-it-works')} className="w-full sm:w-auto px-8 border-navy-600 text-navy-200 hover:bg-navy-800">
                EXPLORE HOW IT WORKS
              </Button>
            </div>
          </div>

          {/* Hero Visual (Real-time dashboard concept) */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none perspective-[1000px]">
            <div className="relative bg-navy-900/80 backdrop-blur-xl border border-navy-700/50 rounded-2xl shadow-2xl overflow-hidden transform lg:rotate-y-[-5deg] lg:rotate-x-[5deg] transition-transform duration-700 hover:rotate-0">
              {/* Header */}
              <div className="px-4 py-3 border-b border-navy-700/50 flex items-center justify-between bg-navy-950/50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emergency-500 animate-pulse" />
                  <span className="text-xs font-bold text-navy-200 tracking-wider">ACTIVE SOS: EMG-8492</span>
                </div>
                <span className="text-[10px] bg-emergency-500/20 text-emergency-400 px-2 py-1 rounded font-mono font-bold">CODE RED</span>
              </div>
              
              {/* Map concept */}
              <div className="h-[240px] w-full bg-navy-950 relative overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                {/* Route line */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 240">
                  <path d="M 50 180 C 150 180, 150 60, 350 60" fill="none" stroke="#0ea5e9" strokeWidth="4" strokeDasharray="8 4" className="opacity-50" />
                  <path d="M 50 180 C 150 180, 150 60, 200 120" fill="none" stroke="#10b981" strokeWidth="4" />
                </svg>

                {/* Markers */}
                <div className="absolute top-[170px] left-[40px] w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(16,185,129,0.6)] flex items-center justify-center text-[10px]">🚑</div>
                <div className="absolute top-[50px] left-[340px] w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center justify-center text-[10px]">🏥</div>
                
                {/* Status popup */}
                <div className="absolute top-[100px] left-[80px] bg-navy-900 border border-navy-700 rounded-lg p-2 shadow-xl">
                  <p className="text-[10px] text-navy-400 font-bold mb-1">AMBULANCE A-104</p>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[9px] text-navy-500">ETA</p>
                      <p className="text-xs font-mono font-bold text-white">08:42</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-navy-500">DIST</p>
                      <p className="text-xs font-mono font-bold text-white">4.8 KM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status footer */}
              <div className="grid grid-cols-3 divide-x divide-navy-700/50 bg-navy-900/50">
                <div className="p-3 text-center">
                  <p className="text-[10px] text-navy-400 uppercase font-bold">Traffic</p>
                  <p className="text-xs text-emerald-400 font-bold mt-0.5">CLEARED</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] text-navy-400 uppercase font-bold">Hospital</p>
                  <p className="text-xs text-blue-400 font-bold mt-0.5">NOTIFIED</p>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[10px] text-navy-400 uppercase font-bold">Route</p>
                  <p className="text-xs text-cyan-400 font-bold mt-0.5">OPTIMIZED</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IMPACT STRIP ── */}
      <section className="bg-navy-900/80 border-y border-navy-800 py-6 relative z-20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center">
              <span className="text-sm font-bold text-white tracking-widest uppercase">REAL-TIME COORDINATION</span>
            </div>
            
            <div className="hidden md:flex items-center gap-4 text-navy-400 font-medium text-sm">
              <span className="text-white">Ambulance</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span className="text-white">Traffic Response</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span className="text-white">Hospital</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-semibold text-cyan-400">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Location Visibility</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Route Optimization</span>
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Hospital Coordination</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">From Emergency Call to Hospital Arrival</h2>
            <p className="text-navy-300 max-w-2xl mx-auto">A seamless workflow connecting all critical parties during the golden hour of emergency response.</p>
          </div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-navy-800 -translate-y-1/2 hidden md:block" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
              {[
                { step: '01', title: 'Live Location', desc: 'Ambulance transmits its current location and route information in real-time.', icon: '📍' },
                { step: '02', title: 'Route Intelligence', desc: 'AERO identifies the optimal route based on current road and traffic conditions.', icon: '🧠' },
                { step: '03', title: 'Traffic Coordination', desc: 'Traffic-response teams receive the route and proactively coordinate clearance.', icon: '🚦' },
                { step: '04', title: 'Hospital Arrival', desc: 'The destination hospital receives live ETA and patient details for immediate prep.', icon: '🏥' }
              ].map((item, i) => (
                <div key={i} className="bg-navy-900 border border-navy-800 rounded-2xl p-6 flex flex-col items-center text-center relative group hover:border-navy-600 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-navy-950 border border-navy-700 flex items-center justify-center text-xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold text-emergency-400 tracking-wider mb-2">STEP {item.step}</span>
                  <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-navy-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY AERO SECTION (Problem/Solution) ── */}
      <section className="py-24 px-6 bg-navy-900/50 border-y border-navy-800">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Emergency Response Is a Coordination Problem
            </h2>
            <p className="text-navy-300 text-lg leading-relaxed">
              In critical moments, emergency response involves multiple disconnected moving parts: ambulances, traffic, dispatch, and hospitals.
            </p>
            <p className="text-navy-300 text-lg leading-relaxed">
              AERO brings these fragmented pieces together into <strong className="text-white">one coordinated workflow</strong>, ensuring everyone has the context they need exactly when they need it.
            </p>
          </div>
          
          <div className="flex-1 w-full max-w-md">
            <div className="bg-navy-950 p-6 rounded-2xl border border-navy-800 shadow-2xl relative">
              {/* Diagram */}
              <div className="flex flex-col gap-4">
                <div className="bg-navy-900 p-4 rounded-xl border border-navy-700 flex items-center justify-center gap-3">
                  <span className="text-2xl">🚑</span>
                  <span className="font-bold text-white">Ambulance</span>
                </div>
                
                <div className="flex justify-center text-navy-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </div>
                
                <div className="bg-gradient-to-r from-emergency-900/40 to-cyan-900/40 p-4 rounded-xl border border-emergency-500/30 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                  <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-emergency-400 to-cyan-400 tracking-widest">AERO PLATFORM</span>
                </div>
                
                <div className="flex justify-between px-10 text-navy-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="-rotate-45"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rotate-45"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-navy-900 p-4 rounded-xl border border-navy-700 flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🚦</span>
                    <span className="font-bold text-white text-sm">Traffic Control</span>
                  </div>
                  <div className="bg-navy-900 p-4 rounded-xl border border-navy-700 flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🏥</span>
                    <span className="font-bold text-white text-sm">Hospital ER</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built for the Critical Minutes</h2>
            <p className="text-navy-300 max-w-2xl mx-auto">Advanced tools designed specifically for emergency operations centers and frontline responders.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Real-Time GPS', desc: 'Live ambulance location and highly accurate route visibility on interactive maps.', icon: '📡' },
              { title: 'Intelligent Routing', desc: 'Identify the most efficient emergency routes using live OpenStreetMap data.', icon: '🗺️' },
              { title: 'Traffic Coordination', desc: 'Help police response teams coordinate and clear junctions ahead of the ambulance.', icon: '🚨' },
              { title: 'ETA Intelligence', desc: 'Provide continuously updated arrival estimates to destination hospitals.', icon: '⏱️' },
              { title: 'Hospital Coordination', desc: 'Connect emergency routing directly with real destination hospital capabilities.', icon: '🏥' },
              { title: 'Emergency Dashboard', desc: 'Give operators a centralized, distraction-free view of all active incidents.', icon: '🖥️' }
            ].map((f, i) => (
              <div key={i} className="bg-navy-900/40 border border-navy-800 rounded-2xl p-6 hover:bg-navy-800/60 hover:border-navy-600 transition-all cursor-default group">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">{f.icon}</div>
                <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
                <p className="text-sm text-navy-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMAND CENTER / PRODUCT SHOWCASE ── */}
      <section className="py-24 px-6 bg-navy-900/30 border-y border-navy-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">One Emergency. One Coordinated Response.</h2>
            <p className="text-navy-300 max-w-2xl mx-auto">A unified interface that gives every stakeholder the exact operational picture they need.</p>
          </div>

          <div className="bg-navy-950 border border-navy-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row">
            {/* Left Panel */}
            <div className="lg:w-72 bg-navy-900 p-6 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-navy-700/50">
              <div>
                <span className="text-[10px] font-bold text-emergency-500 bg-emergency-500/10 px-2 py-1 rounded tracking-wider">ACTIVE EMERGENCY</span>
                <h3 className="text-xl font-bold text-white mt-3">AMBULANCE A-104</h3>
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-navy-400 text-xs mb-1">Emergency:</p>
                  <p className="font-semibold text-white">Cardiac (Code Red)</p>
                </div>
                <div>
                  <p className="text-navy-400 text-xs mb-1">Status:</p>
                  <p className="font-semibold text-emerald-400">EN ROUTE</p>
                </div>
                <div>
                  <p className="text-navy-400 text-xs mb-1">ETA:</p>
                  <p className="font-mono text-2xl font-bold text-white">08:42</p>
                </div>
              </div>
            </div>

            {/* Center Map Area */}
            <div className="flex-1 bg-navy-950 relative min-h-[300px]">
              {/* Map background abstraction */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 10 90 Q 40 90, 40 50 T 90 20" fill="none" stroke="#10b981" strokeWidth="1.5" />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy-900/80 backdrop-blur px-4 py-2 rounded-lg border border-navy-700 text-xs text-navy-300 font-mono">
                Live Routing Visualization
              </div>
            </div>

            {/* Right Panel */}
            <div className="lg:w-64 bg-navy-900 p-6 flex flex-col gap-6 border-t lg:border-t-0 lg:border-l border-navy-700/50">
              <h4 className="text-xs font-bold text-navy-400 tracking-wider uppercase mb-2">RESPONSE TEAM</h4>
              
              <div className="space-y-4">
                <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
                  <p className="text-white text-sm font-semibold mb-1">Traffic Unit</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="text-xs text-cyan-400 font-bold">ALERTED</span>
                  </div>
                </div>
                
                <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
                  <p className="text-white text-sm font-semibold mb-1">Hospital</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-400 font-bold">NOTIFIED</span>
                  </div>
                </div>
                
                <div className="bg-navy-950 p-3 rounded-xl border border-navy-800">
                  <p className="text-white text-sm font-semibold mb-1">Route</p>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-blue-400 font-bold">OPTIMIZED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUTURE VISION ── */}
      <section id="vision" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Future of Emergency Mobility</h2>
            <p className="text-navy-300 text-lg">AERO is built to scale. While we focus on robust core routing today, our architecture supports city-wide intelligence tomorrow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6">
              <div className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded mb-4">CURRENT</div>
              <h4 className="text-lg font-bold text-white mb-2">Live Corridor Coordination</h4>
              <ul className="space-y-2 text-sm text-navy-300">
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Single ambulance SOS tracking</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> OSM-based intelligent routing</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Real-time police junction alerts</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Hospital proximity auto-selection</li>
              </ul>
            </div>
            
            <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-transparent pointer-events-none" />
              <div className="inline-block bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded mb-4">FUTURE</div>
              <h4 className="text-lg font-bold text-white mb-2">City-Wide Intelligence</h4>
              <ul className="space-y-2 text-sm text-navy-300 relative z-10">
                <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">○</span> Predictive traffic routing AI</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">○</span> Multi-ambulance swarm coordination</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">○</span> Smart city traffic light integration</li>
                <li className="flex items-start gap-2"><span className="text-cyan-500 mt-0.5">○</span> Live hospital capacity awareness</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 bg-navy-900/80 border-t border-navy-800 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emergency-600/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            When Every Second Counts,<br />Coordination Matters.
          </h2>
          <p className="text-xl text-navy-300 mb-10">
            See how AERO connects emergency movement, traffic response, and hospital coordination.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" onClick={() => navigate('/register')} className="w-full sm:w-auto px-8 bg-emergency-600 hover:bg-emergency-500 text-white shadow-lg shadow-emergency-900/40">
              GET STARTED
            </Button>
            <Button variant="outline" size="xl" onClick={() => scrollToSection('how-it-works')} className="w-full sm:w-auto px-8 border-navy-600 text-navy-200 hover:bg-navy-800">
              EXPLORE THE PLATFORM
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy-950 py-12 px-6 border-t border-navy-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>
              <div className="w-6 h-6 rounded bg-emergency-600 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                  <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" />
                </svg>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">AERO</span>
            </div>
            <p className="text-sm text-navy-400 max-w-sm mb-2">
              Emergency Response Routing
            </p>
            <p className="text-xs text-navy-500 max-w-sm">
              Coordinating ambulances, traffic teams, and hospitals for critical urban scenarios.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-navy-100 mb-4 text-sm tracking-wider uppercase">Platform</h4>
            <ul className="space-y-3 text-sm text-navy-400">
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
              <li><button onClick={() => scrollToSection('vision')} className="hover:text-white transition-colors">Future Vision</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-navy-100 mb-4 text-sm tracking-wider uppercase">Access</h4>
            <ul className="space-y-3 text-sm text-navy-400">
              <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Sign In</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Get Started</button></li>
              <li><button onClick={() => navigate('/showcase')} className="hover:text-white transition-colors">UI Components</button></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-navy-900 text-xs text-navy-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} AERO Platform. All rights reserved.</p>
          <p>Concept software. Not intended for actual life-safety operations without proper deployment.</p>
        </div>
      </footer>
    </div>
  );
}
