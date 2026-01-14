
import React from 'react';
import { Project, Transaction } from '../types';
import { Wallet, Landmark, TrendingUp } from 'lucide-react';
import { DynamicIcon } from '../App';
import { useAuth } from '../context/AuthContext';

interface ProjectHeaderProps {
  project: Project;
  transactions: Transaction[];
  onAddInvestment: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, transactions, onAddInvestment }) => {
  const { permissions } = useAuth();
  
  const projectBalance = transactions
    .filter(t => t.type !== 'investment')
    .reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0);

  const projectInvestment = transactions
    .filter(t => t.type === 'investment')
    .reduce((acc, t) => acc + t.amount, 0);

  const showAnyStat = permissions.canViewProjectInvestment || permissions.canViewProjectBalance;

  return (
    <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 min-h-[120px]">
      <div className="flex items-start gap-5 min-w-0 flex-1">
        <div 
          className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl text-white animate-in zoom-in duration-500" 
          style={{ backgroundColor: project.color }}
        >
          <DynamicIcon name={project.icon || 'Briefcase'} size={38} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 truncate tracking-tight">
                {project.name}
              </h1>
              <p className="text-slate-400 mt-1 text-sm md:text-lg font-medium line-clamp-1 h-7">
                {project.description || 'Hotel Management Entity'}
              </p>
            </div>
            
            {permissions.canAddTransaction && (
              <button 
                onClick={onAddInvestment}
                className="shrink-0 flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-200 active:scale-95 group sm:ml-4 sm:mt-1"
              >
                <TrendingUp size={16} className="group-hover:translate-y-[-2px] group-hover:translate-x-[2px] transition-transform" />
                Add Investment
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showAnyStat && (
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto lg:shrink-0 lg:ml-4 animate-in fade-in slide-in-from-right-4 duration-500">
          {permissions.canViewProjectInvestment && (
            <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 flex-1 sm:min-w-[260px] md:min-w-[280px] min-h-[96px] transition-transform hover:scale-[1.02]">
              <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl shrink-0">
                <Landmark size={24} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1 whitespace-nowrap">Total Investment</p>
                <p className="text-xl md:text-2xl font-black text-violet-700 tracking-tight whitespace-nowrap tabular-nums overflow-hidden text-ellipsis">
                  PKR {projectInvestment.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {permissions.canViewProjectBalance && (
            <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex items-center gap-4 flex-1 sm:min-w-[260px] md:min-w-[280px] min-h-[96px] transition-transform hover:scale-[1.02]">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                <Wallet size={24} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1 whitespace-nowrap">Operating Wallet</p>
                <p className={`text-xl md:text-2xl font-black tracking-tight whitespace-nowrap tabular-nums overflow-hidden text-ellipsis ${projectBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                  PKR {projectBalance.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default ProjectHeader;
