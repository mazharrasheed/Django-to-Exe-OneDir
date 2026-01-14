
import React from 'react';
import { User, AppTheme } from '../types';
import { Menu, LogOut, User as UserIcon, Globe, DownloadCloud, PlusCircle, Palette, Landmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  user: User | null;
  onLogout: () => void;
  onExport: () => void;
  globalBalance: number;
  globalInvestment: number;
  onSetView: (view: 'dashboard' | 'users' | 'profile' | 'reports') => void;
  onGeneralEntry: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onToggleSidebar,
  user,
  onLogout,
  onExport,
  globalBalance,
  globalInvestment,
  onSetView,
  onGeneralEntry
}) => {
  const { updateUser, permissions } = useAuth();
  const canBackup = user?.role === 'admin' || user?.permissions.canBackup;

  console.log('Navbar render - user permissions:', permissions);

  const cycleTheme = () => {
    if (!user) return;
    const themes: AppTheme[] = ['slate', 'indigo', 'emerald', 'rose', 'amber'];
    const currentTheme = user.theme || 'slate';
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateUser({ ...user, theme: themes[nextIndex] });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 shrink-0 overflow-hidden shadow-sm z-20">
      <button 
        onClick={onToggleSidebar}
        className="p-2 mr-4 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 flex items-center gap-6">
        <div className="flex flex-col">
          <h2 className="text-slate-800 font-black text-lg hidden sm:block tracking-tight leading-none">Overview</h2>
          <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-[0.2em] hidden sm:block mt-1 leading-none opacity-60">Ali & Company</p>
        </div>
        
        {user?.permissions.canAddTransaction && (
          <button 
            onClick={onGeneralEntry}
            className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-1.5 rounded-xl hover:opacity-90 transition-all shadow-md active:scale-95 group"
          >
            <PlusCircle size={16} className="group-hover:rotate-90 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">General Entry</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-4">
        <button 
          onClick={cycleTheme}
          className="p-2 text-slate-400 hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-xl transition-all"
          title="Cycle Theme"
        >
          <Palette size={20} />
        </button>

        {user && canBackup && (
          <button 
            onClick={onExport}
            className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-2xl border border-slate-100 hover:bg-[var(--primary-light)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all text-slate-500 group"
            title="Backup all data to CSV"
          >
            <DownloadCloud size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-tighter">Backup CSV</span>
          </button>
        )}

        {user && (
          <div className="flex items-center gap-4">
            {permissions.canViewProjectInvestment && (
              <div className="hidden lg:flex items-center gap-2 bg-violet-50 px-4 py-1.5 rounded-2xl border border-violet-100">
                <Landmark size={16} className="text-violet-600" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Global Invested</span>
                  <span className="text-sm font-black leading-tight text-violet-700">
                    PKR {globalInvestment.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {permissions.canViewProjectBalance && (
              <div className="flex items-center gap-2 bg-[var(--primary-light)] px-4 py-1.5 rounded-2xl border border-[var(--primary)]/10">
                <Globe size={16} className="text-[var(--primary)]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none">Net Worth</span>
                  <span className={`text-sm font-black leading-tight ${globalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    PKR {globalBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {user && (
          <div className="flex items-center gap-3 border-l border-slate-100 pl-4 md:pl-4">
            <div 
              className="hidden md:block text-right cursor-pointer group"
              onClick={() => onSetView('profile')}
            >
              <p className="text-xs font-black text-slate-800 leading-tight group-hover:text-[var(--primary)] transition-colors">{user.name}</p>
              <p className="text-[10px] font-bold text-slate-400 leading-tight">View Profile</p>
            </div>
            
            <div 
              onClick={() => onSetView('profile')}
              className="w-9 h-9 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-sm overflow-hidden shrink-0 cursor-pointer hover:ring-2 ring-[var(--primary)]/20 transition-all active:scale-95"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={18} />
              )}
            </div>
            
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
