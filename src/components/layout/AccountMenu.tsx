import { useState, useRef, useEffect } from 'react';
import type { UserRole } from '../../types';

interface AccountMenuProps {
  userName: string;
  userRole: UserRole;
}

export function AccountMenu({ userName, userRole }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aero_auth_user');
    window.location.href = '/login';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center text-xs font-medium text-navy-200">
          {userName.charAt(0).toUpperCase()}
        </div>
        <span className="text-[13px] text-navy-100 hidden sm:block font-medium">{userName}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-navy-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-navy-900 border border-navy-700 rounded-lg shadow-card py-1 z-50 animate-fade-in origin-top-right">
          <div className="px-4 py-3 border-b border-navy-800 mb-1">
            <p className="text-sm font-medium text-navy-50 truncate">{userName}</p>
            <p className="text-[11px] text-navy-400 mt-0.5">{userRole}</p>
          </div>
          
          <button className="w-full text-left px-4 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Account Settings
          </button>
          
          <button className="w-full text-left px-4 py-2 text-sm text-navy-200 hover:bg-navy-800 hover:text-white transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Security & Privacy
          </button>
          
          <div className="h-px bg-navy-800 my-1" />
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-emergency-400 hover:bg-emergency-900/50 transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
