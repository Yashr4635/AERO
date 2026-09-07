import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg-main relative overflow-x-hidden selection:bg-brand-primary/30 text-text-primary font-sans">
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-brand-primary/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#35C7FF]/5 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#070A0F]/90 backdrop-blur-md border-b border-border-subtle h-16 flex items-center">
        <div className="max-w-4xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-white font-bold tracking-widest text-lg hidden sm:block">AERO</span>
          </div>
          
          <button 
            onClick={() => navigate(-1)}
            className="text-text-secondary hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 pt-32 pb-24 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-3xl mx-auto"
        >
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">{title}</h1>
            <p className="text-text-secondary text-sm font-medium tracking-wide">Last Updated: {lastUpdated}</p>
          </div>

          <div className="prose prose-invert prose-red max-w-none">
            {/* Base styles applied to legal content */}
            <div className="space-y-8 text-[#A7ADB5] leading-relaxed text-sm md:text-base">
              {children}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
