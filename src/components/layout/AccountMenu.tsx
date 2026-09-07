import { useState, useRef, useEffect } from 'react';
import type { UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface AccountMenuProps {
  userName: string;
  userRole: UserRole;
}

export function AccountMenu({ userName, userRole }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-full bg-bg-surface flex items-center justify-center text-xs font-medium text-text-primary">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="text-[13px] text-text-primary hidden sm:block font-medium">{userName}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-bg-elevated border border-border-subtle rounded-lg shadow-2xl py-1 z-50 animate-fade-in origin-top-right">
          <div className="px-4 py-3 border-b border-border-subtle mb-1">
            <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
            <p className="text-[11px] text-text-secondary mt-0.5">{userRole}</p>
          </div>
          
          <button 
            onClick={() => { setIsOpen(false); navigate('/settings/account'); }}
            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Account Settings
          </button>
          
          <button 
            onClick={() => { setIsOpen(false); navigate('/settings/security'); }}
            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Security & Privacy
          </button>
          
          <div className="h-px bg-border-subtle my-1" />
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
