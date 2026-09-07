import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useInView } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);


/* ─── SVG Route Animation ─── */
function RouteAnimation({ active }: { active: boolean }) {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path || !dot) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    if (active) {
      gsap.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' });
      gsap.fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.2 });
      gsap.to(dot, {
        motionPath: { path: '#route-path', align: '#route-path', autoRotate: false, start: 0, end: 1 },
        duration: 2.4, ease: 'power2.inOut', delay: 0,
      });
    } else {
      gsap.set(path, { strokeDashoffset: len });
      gsap.set(dot, { opacity: 0 });
    }
  }, [active]);

  return (
    <svg viewBox="0 0 600 300" className="w-full h-full" fill="none" preserveAspectRatio="none">
      {/* Grid lines */}
      {[50,100,150,200,250].map(y => (
        <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {[100,200,300,400,500].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {/* Blocked route A — faded red */}
      <path d="M 60 240 C 120 240 180 60 280 80 S 380 120 500 60" stroke="#FF3B30" strokeWidth="2" strokeDasharray="6 4" opacity="0.25" />

      {/* Optimal route B — drawn */}
      <path id="route-path" ref={pathRef} d="M 60 240 Q 150 260 240 200 T 420 140 T 550 80" stroke="#20D67A" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />

      {/* Origin */}
      <circle cx="60" cy="240" r="6" fill="#FF3B30" />
      <circle cx="60" cy="240" r="12" fill="#FF3B30" opacity="0.2" className="animate-pulse" />

      {/* Destination */}
      <circle cx="550" cy="80" r="6" fill="#20D67A" />
      <circle cx="550" cy="80" r="12" fill="#20D67A" opacity="0.2" />

      {/* Moving ambulance dot */}
      <circle ref={dotRef} cx="60" cy="240" r="5" fill="#35C7FF" opacity="0" />
    </svg>
  );
}

/* ─── Grain overlay ─── */
function Grain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.015]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

/* ─── Hero Dispatch Card — ticking ETA ─── */
function HeroDispatchCard() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);

  const [etaSec, setEtaSec] = useState(374); // 06:14
  const [speed, setSpeed] = useState(48);
  const statuses = ['DEMO ROUTE', 'SIMULATION', 'DEMO ROUTE'];
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const t = setInterval(() => {
      setEtaSec(prev => Math.max(prev - 1, 120));
      setSpeed(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.min(62, Math.max(38, prev + delta));
      });
    }, 1000);
    const s = setInterval(() => setStatusIdx(i => (i + 1) % statuses.length), 4000);
    return () => { clearInterval(t); clearInterval(s); };
  }, [isInView]);

  const mins = String(Math.floor(etaSec / 60)).padStart(2, '0');
  const secs = String(etaSec % 60).padStart(2, '0');

  return (
    <div ref={ref} className="telemetry-panel rounded-xl p-5 w-72">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
        <span className="telemetry-label">SIMULATED DISPATCH — A-104</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="telemetry-label">Location</span>
          <span className="telemetry-value text-[11px]">12.9716°N 77.5946°E</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="telemetry-label">Speed</span>
          <span className="telemetry-value text-[11px]">{speed} km/h</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="telemetry-label">ETA</span>
          <span className="telemetry-value text-[11px]" style={{ fontVariantNumeric: 'tabular-nums' }}>{mins}:{secs}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="telemetry-label">Status</span>
          <span className="telemetry-value text-[11px]" style={{ color: '#FFB020' }}>{statuses[statusIdx]}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */
export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signalState, setSignalState] = useState<'red' | 'green'>('red');
  const [routeActive, setRouteActive] = useState(false);


  const heroRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const detectionRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const junctionRef = useRef<HTMLDivElement>(null);
  const hospitalRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  /* Mouse Parallax Setup */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const parallaxX = useTransform(smoothMouseX, [-1, 1], [-8, 8]);
  const parallaxY = useTransform(smoothMouseY, [-1, 1], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  const [activeSection, setActiveSection] = useState('hero');

  /* GSAP ScrollTrigger setup */
  useEffect(() => {
    const ctx = gsap.context(() => {
      
      const sections = [
        { id: 'hero', ref: heroRef },
        { id: 'platform', ref: problemRef },
        { id: 'how-it-works', ref: detectionRef },
        { id: 'technology', ref: routeRef },
        { id: 'network', ref: junctionRef }
      ];

      sections.forEach(({ id, ref }) => {
        if (!ref.current) return;
        ScrollTrigger.create({
          trigger: ref.current,
          start: 'top 50%',
          end: 'bottom 50%',
          onEnter: () => setActiveSection(id),
          onEnterBack: () => setActiveSection(id),
        });
      });

      /* Problem section — text reveals */
      gsap.from('.problem-line', {
        scrollTrigger: { trigger: problemRef.current, start: 'top 75%' },
        y: 60, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out',
      });

      /* Detection section */
      gsap.from('.detection-panel', {
        scrollTrigger: { trigger: detectionRef.current, start: 'top 70%' },
        x: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out',
      });

      /* Route section */
      ScrollTrigger.create({
        trigger: routeRef.current,
        start: 'top 65%',
        onEnter: () => setRouteActive(true),
        onLeaveBack: () => setRouteActive(false),
      });

      /* Junction section — signal flip */
      ScrollTrigger.create({
        trigger: junctionRef.current,
        start: 'top 60%',
        onEnter: () => {
          setTimeout(() => setSignalState('green'), 1400);
        },
        onLeaveBack: () => {
          setSignalState('red');
        },
      });

      /* Hospital section */
      gsap.from('.hospital-stat', {
        scrollTrigger: { trigger: hospitalRef.current, start: 'top 70%' },
        y: 30, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
      });

      /* Success section */
      gsap.from('.success-item', {
        scrollTrigger: { trigger: successRef.current, start: 'top 75%' },
        y: 40, opacity: 0, duration: 0.7, stagger: 0.18, ease: 'power3.out',
      });

    });
    return () => ctx.revert();
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const NAV_LINKS = [
    { label: 'Platform', id: 'platform' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Technology', id: 'technology' },
    { label: 'Network', id: 'network' },
  ];

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: '#070A0F', colorScheme: 'dark' }}>
      <Grain />

      {/* ══════════ NAVBAR ══════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#070A0F]/90 backdrop-blur-md border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[72px]">
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FF3B30', boxShadow: '0 0 16px rgba(255,59,48,0.45)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="white" opacity="0.95"/>
                <path d="M9 12h6M12 9v6" stroke="#070A0F" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[#F5F7FA] font-black text-lg tracking-tight">AERO</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 pl-8">
            {NAV_LINKS.map(({ label, id }) => {
              const isActive = activeSection === id;
              return (
                <button key={id} onClick={() => scrollTo(id)} className="group relative text-[13px] font-medium transition-all duration-200 hover:-translate-y-[1px]" style={{ color: isActive ? '#F5F7FA' : '#8E99A8' }}>
                  {label}
                  <span className={`absolute -bottom-1 left-0 w-full h-[2px] transition-transform duration-300 ease-out origin-left ${isActive ? 'bg-[#FF3B30] scale-x-100' : 'bg-[#FF3B30] scale-x-0 group-hover:scale-x-100 opacity-50'}`} />
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-[12px] font-bold tracking-wide text-[#F5F7FA] bg-transparent border border-white/10 rounded-full px-6 py-2.5 transition-colors duration-200 hover:bg-white/[0.04]"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-[12px] font-black tracking-[0.1em] uppercase px-7 py-2.5 rounded-full text-[#F5F7FA] transition-all duration-200 hover:-translate-y-[1px] shadow-[0_4px_14px_rgba(255,59,48,0.2)] hover:brightness-110 active:scale-95"
              style={{ background: '#FF3B30' }}
            >
              Get Started
            </button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-[#F5F7FA] p-1" onClick={() => setMobileMenuOpen(v => !v)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileMenuOpen ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] overflow-hidden" style={{ background: '#0B0F16' }}>
              <div className="p-5 space-y-1">
                {NAV_LINKS.map(({ label, id }) => (
                  <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left py-3 text-sm font-medium text-[#8E99A8] hover:text-[#F5F7FA] border-b border-white/[0.05] transition-colors">
                    {label}
                  </button>
                ))}
                <div className="pt-4 space-y-3">
                  <button onClick={() => navigate('/login')} className="block w-full py-3 text-center text-sm font-bold text-[#F5F7FA] border border-white/10 rounded-full hover:bg-white/[0.04] transition-colors">
                    Sign In
                  </button>
                  <button onClick={() => navigate('/register')} className="block w-full py-3 text-center text-[12px] font-black tracking-wider uppercase text-white rounded-full shadow-[0_4px_14px_rgba(255,59,48,0.2)]" style={{ background: '#FF3B30' }}>
                    Get Started
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══════════ HERO ══════════ */}
      <section ref={heroRef} onMouseMove={handleMouseMove} className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden bg-bg-main z-10 isolate">
        {/* Single clean background — NO duplicate */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-bg-main">
          {/* Subtle Parallax / Static Image */}
          <motion.div
            ref={heroImgRef}
            className="absolute inset-0"
            style={{ x: parallaxX, y: parallaxY }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.05 }}
              animate={{ scale: 1.02 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ willChange: 'transform' }}
            >
              <img
                src="/hero_bg.jpg"
                alt="Ambulance navigating through Indian city traffic"
                className="w-full h-full object-cover"
                style={{ objectPosition: '60% 40%' }}
              />
            </motion.div>
          </motion.div>

          {/* Cinematic gradient overlays — sophisticated dark gradient left->right */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-main via-bg-main/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-transparent to-transparent opacity-90" />
          {/* Subtle vignette */}
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(7,10,15,0.4) 100%)' }} />
        </div>

        {/* Hero content */}
        <motion.div className="relative z-10 w-full max-w-7xl mx-auto px-6 -translate-y-8 lg:-translate-y-12" style={{ opacity: heroOpacity }}>
          <div className="max-w-[540px]">

            {/* Eyebrow status label */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-black tracking-[0.18em] uppercase backdrop-blur-md" style={{ borderColor: 'rgba(255,59,48,0.25)', background: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" style={{ animationDuration: '2.5s' }} />
                Academic Prototype
              </div>
              <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                SIMULATION ONLY — NOT AN OFFICIAL EMERGENCY SERVICE
              </span>
            </motion.div>

            {/* Main headline — staggered word entrance */}
            <div className="cinematic-h1 mb-6 leading-[1.05]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                EVERY
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                SECOND
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{ color: 'rgba(244,247,250,0.4)' }}
              >
                MATTERS.
              </motion.div>
            </div>

            {/* Sub-copy */}
            <motion.p
              className="text-base md:text-lg leading-relaxed mb-10 max-w-[520px]"
              style={{ color: '#A7ADB5' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
            >
              AERO demonstrates how emergency movement, traffic coordination and hospital readiness could be orchestrated through real-time intelligence.
            </motion.p>

            {/* CTAs with hover micro-interactions */}
            <motion.div
              className="flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.7 }}
            >
              <button
                onClick={() => navigate('/login')}
                className="group flex items-center gap-3 text-[12px] font-black tracking-[0.12em] uppercase text-white px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-[2px] shadow-[0_4px_20px_rgba(255,59,48,0.25)] hover:shadow-[0_8px_30px_rgba(255,59,48,0.4)]"
                style={{ background: '#FF3B30' }}
              >
                START EMERGENCY ROUTING
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform duration-200 group-hover:translate-x-1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button
                onClick={() => scrollTo('how-it-works')}
                className="flex items-center gap-2 text-[12px] font-bold tracking-wider text-[#F5F7FA] hover:text-white px-8 py-4 rounded-full border transition-all duration-200 hover:-translate-y-[1px] hover:bg-white/[0.04]"
                style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(7,10,15,0.2)', backdropFilter: 'blur(8px)' }}
              >
                SEE HOW IT WORKS
              </button>
            </motion.div>

          </div>
        </motion.div>

        {/* Live dispatch card — floating lower right */}
        <motion.div
          className="absolute bottom-12 right-6 lg:right-12 xl:right-16 hidden lg:block z-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <HeroDispatchCard />
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="telemetry-label tracking-widest text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>SCROLL</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════ SECTION 01 — THE PROBLEM ══════════ */}
      <section id="platform" ref={problemRef} className="relative py-32 md:py-44 overflow-hidden">
        {/* Background image with cinematic overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="w-full h-full origin-center" 
            initial={{ scale: 1.05, opacity: 0 }} 
            whileInView={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 1.5, ease: 'easeOut' }} 
            viewport={{ once: true, margin: '-10%' }}
          >
            <img src="/ambulance_traffic.jpg" alt="" loading="lazy" className="w-full h-full object-cover object-center opacity-70" />
          </motion.div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(7,10,15,0.88) 0%, rgba(7,10,15,0.65) 40%, rgba(7,10,15,0.2) 75%, rgba(7,10,15,0.05) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,10,15,1) 0%, rgba(7,10,15,0) 15%, rgba(7,10,15,0) 85%, rgba(7,10,15,1) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="telemetry-label mb-6" style={{ color: '#FF3B30' }}>01 — The Problem</p>
            <h2 className="cinematic-h2 problem-line mb-2">WHEN TRAFFIC</h2>
            <h2 className="cinematic-h2 problem-line mb-2" style={{ color: 'rgba(244,247,250,0.28)' }}>STOPS,</h2>
            <h2 className="cinematic-h2 problem-line mb-10">RESPONSE TIME<br />DOESN'T.</h2>
            <p className="problem-line text-base leading-relaxed max-w-md" style={{ color: '#8D98A6' }}>
              In dense Indian cities, ambulances lose an average of <strong className="text-white">14 critical minutes</strong> to urban congestion. Every minute past the golden hour reduces survival rates dramatically.
            </p>
          </div>

          {/* Stats panel */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '14', suffix: ' min', label: 'Avg. urban delay', color: '#FF3B30' },
              { value: '40', suffix: '%', label: 'Preventable fatalities', color: '#FF3B30' },
              { value: '1.2', suffix: 'M', label: 'Emergency calls/year', color: '#8D98A6' },
              { value: '6', suffix: 'sec', label: 'AERO clearance latency', color: '#20D67A' },
            ].map((s) => (
              <div key={s.label} className="problem-line telemetry-panel rounded-xl p-5">
                <p className="text-3xl font-black mb-1" style={{ color: s.color, fontFamily: 'ui-monospace, monospace' }}>
                  {s.value}<span className="text-xl">{s.suffix}</span>
                </p>
                <p className="telemetry-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 02 — LIVE DETECTION ══════════ */}
      <section id="how-it-works" ref={detectionRef} className="relative py-32 md:py-44 overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="w-full h-full origin-center" 
            initial={{ scale: 1.05, opacity: 0 }} 
            whileInView={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 1.5, ease: 'easeOut' }} 
            viewport={{ once: true, margin: '-10%' }}
          >
            <img src="/hero_traffic.jpg" alt="" loading="lazy" className="w-full h-full object-cover object-[center_30%] opacity-[0.55]" />
          </motion.div>
          {/* Gradients for text protection and soft vertical blending */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(13,18,25,0.95) 0%, rgba(13,18,25,0.75) 45%, rgba(13,18,25,0.2) 80%, rgba(13,18,25,0.05) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,10,15,1) 0%, rgba(13,18,25,0) 15%, rgba(13,18,25,0) 85%, rgba(7,10,15,1) 100%)' }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <p className="telemetry-label mb-6" style={{ color: '#35C7FF' }}>02 — Live Detection</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="cinematic-h2 mb-8">AERO IDENTIFIES<br /><span style={{ color: 'rgba(244,247,250,0.28)' }}>THE VEHICLE.</span></h2>
              <p className="text-base leading-relaxed mb-10" style={{ color: '#8D98A6' }}>
                The moment an emergency is declared, AERO locks on to the ambulance. Real-time GPS telemetry streams every 500ms — creating a precise, live picture of the vehicle's position, speed, and vector.
              </p>

              {/* Telemetry readout */}
              <div className="detection-panel telemetry-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />
                    <span className="telemetry-label text-[10px]">Ambulance A-104 — Live</span>
                  </div>
                  <span className="telemetry-label" style={{ color: '#20D67A' }}>TRACKING</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Latitude', value: '12.9716° N' },
                    { label: 'Longitude', value: '77.5946° E' },
                    { label: 'Speed', value: '52 km/h' },
                    { label: 'Heading', value: '042° NNE' },
                    { label: 'Update Rate', value: '500 ms' },
                    { label: 'Signal', value: '4G / LTE' },
                  ].map(r => (
                    <div key={r.label}>
                      <p className="telemetry-label mb-1">{r.label}</p>
                      <p className="telemetry-value text-sm">{r.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual map mock */}
            <div className="detection-panel relative rounded-2xl overflow-hidden" style={{ minHeight: 380 }}>
              <img src="/ambulance_traffic.jpg" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 40% 50%, rgba(53,199,255,0.07) 0%, transparent 70%)' }} />

              {/* Simulated map grid */}
              <div className="relative z-10 w-full h-full p-6 min-h-[380px] flex flex-col justify-between">
                {/* Top status row */}
                <div className="flex items-center justify-between">
                  <div className="telemetry-panel rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35C7FF] animate-pulse" />
                    <span className="telemetry-label">Live Map Feed</span>
                  </div>
                  <div className="telemetry-panel rounded-lg px-3 py-2">
                    <span className="telemetry-value text-[10px]">Zoom 14x</span>
                  </div>
                </div>

                {/* Centre ambulance icon */}
                <div className="flex-1 flex items-center justify-center relative">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.3)' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                    </div>
                    {/* Ping rings */}
                    {[1,2,3].map(i => (
                      <div key={i} className="absolute inset-0 rounded-full border border-[#FF3B30]/20 animate-ping" style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2s' }} />
                    ))}
                  </div>
                </div>

                {/* Bottom coords */}
                <div className="flex items-end justify-between">
                  <div className="telemetry-panel rounded-lg px-3 py-2">
                    <p className="telemetry-label mb-0.5">Position</p>
                    <p className="telemetry-value text-[10px]">12.9716°N / 77.5946°E</p>
                  </div>
                  <div className="telemetry-panel rounded-lg px-3 py-2 text-right">
                    <p className="telemetry-label mb-0.5">Speed</p>
                    <p className="telemetry-value text-[10px]">52 km/h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 03 — ROUTE INTELLIGENCE ══════════ */}
      <section id="technology" ref={routeRef} className="relative py-32 md:py-44 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="w-full h-full origin-center" 
            initial={{ scale: 1.05, opacity: 0 }} 
            whileInView={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 1.5, ease: 'easeOut' }} 
            viewport={{ once: true, margin: '-10%' }}
          >
            <img src="/ambulance_traffic.jpg" alt="" loading="lazy" className="w-full h-full object-cover object-[center_20%] opacity-[0.35]" />
          </motion.div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(7,10,15,0.95) 0%, rgba(7,10,15,0.7) 45%, rgba(7,10,15,0.3) 80%, rgba(7,10,15,0.05) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,10,15,1) 0%, rgba(7,10,15,0) 15%, rgba(7,10,15,0) 85%, rgba(7,10,15,1) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <p className="telemetry-label mb-6" style={{ color: '#20D67A' }}>03 — Route Intelligence</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Route visualization */}
            <div className="relative rounded-2xl overflow-hidden" style={{ background: '#0D1219', border: '1px solid rgba(255,255,255,0.07)', minHeight: 320 }}>
              <div className="absolute inset-0 p-4">
                <RouteAnimation active={routeActive} />
              </div>

              {/* Route A badge */}
              <div className="absolute top-6 left-6 telemetry-panel rounded-xl px-4 py-3">
                <p className="telemetry-label mb-1" style={{ color: '#FF3B30' }}>Route A — Blocked</p>
                <p className="telemetry-value text-sm" style={{ color: '#FF3B30' }}>ETA 14:32 · Traffic HIGH</p>
              </div>

              {/* Route B badge */}
              <div className="absolute bottom-6 right-6 telemetry-panel rounded-xl px-4 py-3" style={{ borderColor: 'rgba(32,214,122,0.2)' }}>
                <p className="telemetry-label mb-1" style={{ color: '#20D67A' }}>Route B — Selected ✓</p>
                <p className="telemetry-value text-sm" style={{ color: '#20D67A' }}>ETA 08:41 · Clearance OK</p>
              </div>
            </div>

            <div>
              <h2 className="cinematic-h2 mb-8">OPTIMAL<br /><span style={{ color: 'rgba(244,247,250,0.28)' }}>ROUTE.</span><br />INSTANTLY.</h2>
              <p className="text-base leading-relaxed mb-10" style={{ color: '#8D98A6' }}>
                AERO's routing engine evaluates every path in real-time — weighing live traffic density, signal states, junction clearance probabilities, and hospital proximity to identify the fastest possible corridor.
              </p>

              <div className="space-y-3">
                {[
                  { label: 'Routes Evaluated', value: '247', suffix: ' paths/sec' },
                  { label: 'Time Saved', value: '5:51', suffix: ' minutes' },
                  { label: 'Confidence', value: '98.4', suffix: '%' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="telemetry-label">{r.label}</span>
                    <span className="telemetry-value text-base">
                      {r.value}<span className="text-[11px] text-[#8D98A6]">{r.suffix}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 04 — TRAFFIC CLEARANCE ══════════ */}
      <section id="network" ref={junctionRef} className="relative py-32 md:py-44 overflow-hidden bg-bg-main z-20 isolate">
        {/* Background image with cinematic overlay */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            className="w-full h-full origin-center" 
            initial={{ scale: 1.05, opacity: 0 }} 
            whileInView={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 1.5, ease: 'easeOut' }} 
            viewport={{ once: true, margin: '-10%' }}
          >
            <img src="/corridor_clearing.jpg" alt="Ambulance clearing traffic corridor" loading="lazy" className="w-full h-full object-cover object-[70%_center] opacity-60" />
          </motion.div>
          {/* Heavy gradient on the left to make text readable, fading to right */}
          <div className="absolute inset-0 bg-gradient-to-r from-bg-main via-bg-main/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-main via-transparent to-bg-main" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT: Text and Info Panel */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: '-10%' }}
            >
              <p className="telemetry-label mb-6" style={{ color: '#FFB020' }}>04 — Traffic Clearance</p>
              <h2 className="cinematic-h2 mb-8">THE JUNCTION<br /><span style={{ color: 'rgba(244,247,250,0.28)' }}>CLEARS</span><br />BEFORE<br />ARRIVAL.</h2>
              <p className="text-base leading-relaxed mb-10" style={{ color: '#8D98A6' }}>
                AERO transmits a priority clearance request to traffic control seconds before the ambulance reaches each junction. Signals flip. Traffic holds. The corridor opens.
              </p>

              {/* ONE COMPACT INFORMATION PANEL */}
              <div className="telemetry-panel rounded-2xl p-6 space-y-4 bg-bg-main/80 backdrop-blur-md border border-white/5">
                {[
                  { label: 'Junction', value: 'J-17 · MG Road' },
                  { label: 'Ambulance Distance', value: '420 m' },
                  { label: 'Signal Priority', value: signalState === 'green' ? 'GRANTED' : 'REQUESTED', color: signalState === 'green' ? '#20D67A' : '#FFB020' },
                  { label: 'Clearance ETA', value: signalState === 'green' ? '00:00 — CLEAR' : '00:06', color: signalState === 'green' ? '#20D67A' : '#FFB020' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="telemetry-label text-white/50">{r.label}</span>
                    <span className="telemetry-value text-sm font-medium" style={r.color ? { color: r.color } : { color: 'white' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Traffic Signal UI */}
          <div className="flex justify-center lg:justify-end">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, margin: '-10%' }}
              className="relative w-full max-w-sm"
            >
              <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#0D1219]/90 backdrop-blur-md border border-white/10 shadow-2xl">
                <p className="telemetry-label text-center text-white/50 tracking-widest">SIGNAL J-17 — PRIORITY OVERRIDE</p>
                
                <div className="flex flex-col items-center gap-4 my-4">
                  {/* Red */}
                  <div className={`w-12 h-12 rounded-full transition-all duration-700 ${signalState === 'red' ? 'bg-[#FF3B30] shadow-[0_0_40px_rgba(255,59,48,0.5)]' : 'bg-white/[0.04]'}`} />
                  {/* Amber */}
                  <div className={`w-12 h-12 rounded-full transition-all duration-300 ${signalState !== 'red' && signalState !== 'green' ? 'bg-[#FFB020] shadow-[0_0_40px_rgba(255,176,32,0.5)]' : 'bg-white/[0.04]'}`} />
                  {/* Green */}
                  <div className={`w-12 h-12 rounded-full transition-all duration-700 ${signalState === 'green' ? 'bg-[#20D67A] shadow-[0_0_40px_rgba(32,214,122,0.5)]' : 'bg-white/[0.04]'}`} />
                </div>

                <div className="flex flex-col items-center gap-2 text-center min-h-[70px] justify-center">
                  <AnimatePresence mode="wait">
                    {signalState === 'green' ? (
                      <motion.div key="cleared" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                        <p className="text-[11px] font-black tracking-widest mb-1 text-[#20D67A]">● CORRIDOR CLEAR</p>
                        <p className="telemetry-value text-lg text-white">CLEARANCE GRANTED</p>
                        <p className="telemetry-value text-sm text-[#20D67A] mt-1">CORRIDOR OPEN</p>
                      </motion.div>
                    ) : (
                      <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                        <p className="text-[11px] font-black tracking-widest mb-1 text-[#FFB020]">● HOLDING TRAFFIC</p>
                        <p className="telemetry-value text-lg text-white">REQUESTING PRIORITY</p>
                        <p className="telemetry-value text-sm text-[#FFB020] mt-1">PROCESSING...</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 05 — HOSPITAL PREPARATION ══════════ */}
      <section ref={hospitalRef} className="relative py-32 md:py-44 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="w-full h-full origin-center" 
            initial={{ scale: 1.05, opacity: 0 }} 
            whileInView={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 1.5, ease: 'easeOut' }} 
            viewport={{ once: true, margin: '-10%' }}
          >
            <img src="/hospital_arrival.jpg" alt="" loading="lazy" className="w-full h-full object-cover object-[70%_center] opacity-[0.65]" />
          </motion.div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(13,18,25,0.95) 0%, rgba(13,18,25,0.85) 45%, rgba(13,18,25,0.25) 80%, rgba(13,18,25,0.1) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,10,15,1) 0%, rgba(13,18,25,0) 15%, rgba(13,18,25,0) 85%, rgba(7,10,15,1) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <p className="telemetry-label mb-6" style={{ color: '#35C7FF' }}>05 — Hospital Preparation</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="cinematic-h2 mb-8">THE HOSPITAL<br /><span style={{ color: 'rgba(244,247,250,0.28)' }}>KNOWS</span><br />BEFORE<br />ARRIVAL.</h2>
              <p className="text-base leading-relaxed" style={{ color: '#8D98A6' }}>
                AERO streams live patient vitals and precise ETA to the receiving ER. The trauma team is assembled, bed allocated, and resources staged — the moment the ambulance is dispatched.
              </p>
            </div>

            {/* Hospital status readout */}
            <div className="space-y-4">
              {/* Telemetry panel replacing the inline image */}
              <div className="hospital-stat relative rounded-2xl p-6 border border-border-subtle" style={{ background: 'rgba(13,18,25,0.6)', backdropFilter: 'blur(12px)' }}>
                <p className="telemetry-label mb-4 text-[#20D67A]">Live Hospital Telemetry</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Trauma Unit', value: 'PREPARING', color: '#FFB020' },
                    { label: 'Bed Status', value: 'READY', color: '#20D67A' },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="telemetry-label mb-1">{s.label}</p>
                      <p className="telemetry-value text-sm" style={{ color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 hospital-stat">
                {[
                  { label: 'Emergency Team', value: 'ALERTED', color: '#35C7FF' },
                  { label: 'ETA', value: '03:18', color: '#F4F7FA' },
                  { label: 'Bed Assigned', value: 'ICU-4', color: '#20D67A' },
                ].map(s => (
                  <div key={s.label} className="telemetry-panel rounded-xl p-4 text-center">
                    <p className="telemetry-value text-base mb-1" style={{ color: s.color }}>{s.value}</p>
                    <p className="telemetry-label">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ SECTION 06 — SUCCESS ══════════ */}
      <section ref={successRef} className="relative py-32 md:py-44 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            className="w-full h-full origin-center" 
            initial={{ scale: 1.05, opacity: 0 }} 
            whileInView={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 1.5, ease: 'easeOut' }} 
            viewport={{ once: true, margin: '-10%' }}
          >
            <img src="/patient_care.jpg" alt="" loading="lazy" className="w-full h-full object-cover object-[center_30%] opacity-[0.35]" />
          </motion.div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,10,15,0.98) 0%, rgba(7,10,15,0.85) 45%, rgba(7,10,15,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(7,10,15,1) 0%, rgba(7,10,15,0) 25%)' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <p className="telemetry-label mb-8 success-item" style={{ color: '#20D67A' }}>06 — Response Complete</p>

          <h2 className="cinematic-h2 mb-6 success-item">RESPONSE<br />COORDINATED.</h2>

          <p className="text-base mb-16 max-w-xl mx-auto success-item" style={{ color: '#8D98A6' }}>
            From distress call to hospital handover — AERO orchestrated every step. No delays. No missed signals. No unprepared ER.
          </p>

          {/* Status line */}
          <div className="flex flex-wrap justify-center gap-4 mb-20 success-item">
            {[
              { label: 'Route', status: 'COMPLETE', color: '#20D67A' },
              { label: 'Traffic', status: 'CLEARED', color: '#20D67A' },
              { label: 'Hospital', status: 'READY', color: '#20D67A' },
              { label: 'Patient', status: 'DELIVERED', color: '#35C7FF' },
            ].map(s => (
              <div key={s.label} className="telemetry-panel rounded-xl px-5 py-3 flex items-center gap-3" style={{ borderColor: `${s.color}22` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="telemetry-label mr-2">{s.label}</span>
                <span className="telemetry-value text-xs" style={{ color: s.color }}>{s.status}</span>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="success-item">
            <div className="inline-block p-px rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,59,48,0.3), rgba(53,199,255,0.15), rgba(32,214,122,0.15))' }}>
              <div className="rounded-2xl px-10 py-12 text-center" style={{ background: '#0D1219' }}>
                <p className="telemetry-label mb-4" style={{ color: '#FF3B30' }}>Join the Network</p>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">Because Every Life Matters.</h3>
                <p className="text-sm mb-8 max-w-sm mx-auto" style={{ color: '#8D98A6' }}>
                  Register as an ambulance operator, traffic authority, hospital staff, or command center admin.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => navigate('/register')}
                    className="text-[12px] font-black tracking-[0.12em] uppercase text-white px-8 py-4 rounded-xl transition-all"
                    style={{ background: '#FF3B30' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 40px rgba(255,59,48,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    Request Access
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-[12px] font-bold tracking-wider text-white/70 hover:text-white px-8 py-4 rounded-xl border transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#070A0F' }}>
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FF3B30' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="white"/>
                  <path d="M9 12h6M12 9v6" stroke="#070A0F" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-white font-black text-sm tracking-tight">AERO</span>
              <span className="telemetry-label hidden sm:inline">— Autonomous Emergency Response Orchestration</span>
            </div>
            <p className="telemetry-label">© 2026 AERO. All rights reserved.</p>
          </div>
          
          {/* Prototype Disclaimer */}
          <div className="pt-6 border-t border-white/5 text-center md:text-left text-[11px] leading-relaxed max-w-4xl" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <strong>PROTOTYPE DISCLAIMER:</strong> AERO is an academic demonstration prototype created to visualize emergency-response coordination workflows. It is not a live emergency service and is not affiliated with or endorsed by any government, police, ambulance, hospital, traffic authority, or other official agency.
          </div>
        </div>
      </footer>

      {/* ══════════ FIXED PROTOTYPE BADGE ══════════ */}
      <div className="fixed bottom-6 left-6 z-[100] pointer-events-none hidden md:block">
        <div className="bg-[#070A0F]/90 backdrop-blur-md border border-white/10 shadow-2xl rounded-lg px-4 py-2.5 text-[10px] font-black tracking-widest uppercase text-white/50">
          Academic Prototype • Simulation Only
        </div>
      </div>
    </div>
  );
}
