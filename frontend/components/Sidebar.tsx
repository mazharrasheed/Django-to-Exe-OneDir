
import React, { useState } from 'react';
import { Project, User } from '../types';
import { 
  X, Trash2, Edit2, LayoutDashboard,
  Target, Layers, PieChart, Users, Cpu, Shield, 
  BarChart3, FileText, Award, Zap, Briefcase, Settings, UserCheck,
  Key, Sparkles, FolderPlus, Hotel, Building2, Building, Home, Activity, Bed, ConciergeBell, Utensils, Coffee
} from 'lucide-react';
import { DynamicIcon } from '../App';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: (name: string, description: string, icon: string) => void;
  onUpdateProject: (id: string, name: string, description: string, icon: string) => void;
  onDeleteProject: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  activeView: 'dashboard' | 'users' | 'profile' | 'reports';
  onSetView: (view: 'dashboard' | 'users' | 'profile' | 'reports') => void;
}

const AVAILABLE_ICONS = [
  'Briefcase', 'Target', 'Layers', 'PieChart', 'Key', 'Users', 
  'Cpu', 'Shield', 'BarChart3', 'FileText', 'Award', 'Zap',
  'Hotel', 'Building2', 'Building', 'Home', 'Activity', 'Sparkles'
];

const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  activeProjectId, 
  onSelectProject, 
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  isOpen,
  onClose,
  activeView,
  onSetView
}) => {
  const { user, permissions } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Briefcase');

  const handleDashboardClick = () => {
    onSelectProject(null);
    onSetView('dashboard');
  };

  const handleManagementClick = (view: 'users' | 'profile' | 'reports') => {
    onSelectProject(null);
    onSetView(view);
  };

  const handleProjectClick = (id: string) => {
    onSelectProject(id);
  };

  const openAdd = () => {
    setEditingProject(null);
    setNewName('');
    setNewDescription('');
    setSelectedIcon('Briefcase');
    setShowForm(true);
  };

  const openEdit = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setEditingProject(p);
    setNewName(p.name);
    setNewDescription(p.description || '');
    setSelectedIcon(p.icon || 'Briefcase');
    setShowForm(true);
  };

  const handleIconSelect = (e: React.MouseEvent, iconName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIcon(iconName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      if (editingProject) {
        onUpdateProject(editingProject.id, newName, newDescription, selectedIcon);
      } else {
        onAddProject(newName, newDescription, selectedIcon);
      }
      setShowForm(false);
    }
  };

  if (!user) return null;

  return (
    <aside className={`fixed lg:relative inset-y-0 left-0 w-72 border-r border-slate-200 flex flex-col h-full z-40 transition-transform duration-300 ease-in-out overflow-hidden bg-white ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[var(--primary-light)]/20 to-slate-50 opacity-80 pointer-events-none" />
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xl cursor-pointer" onClick={handleDashboardClick}>
            <LayoutDashboard size={24} /> Ali & Company
          </div>
          <button onClick={onClose} className="p-2 lg:hidden text-slate-400"><X size={20} /></button>
        </div>

        {permissions.canAddProject && (
          <button onClick={openAdd} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[var(--primary)] text-white rounded-xl font-bold transition-all shadow-md active:scale-95 hover:opacity-90">
            <FolderPlus size={18} /> Add Project
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar pb-6 relative z-10">
        <div className="px-3 py-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">General</span></div>

        {permissions.canViewDashboard && (
          <button onClick={handleDashboardClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${activeView === 'dashboard' && !activeProjectId ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold' : 'text-slate-600 hover:bg-white/60'}`}>
            <LayoutDashboard size={20} /> <span className="text-sm">Project Hub</span>
          </button>
        )}

        {permissions.canViewReports && (
          <button onClick={() => handleManagementClick('reports')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${activeView === 'reports' ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold' : 'text-slate-600 hover:bg-white/60'}`}>
            <FileText size={20} /> <span className="text-sm">Ledger</span>
          </button>
        )}

        {permissions.canViewProjects && (
          <>
            <div className="px-3 pt-6 py-2"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Entities</span></div>
            <div className="space-y-1">
              {projects.map((project) => (
                <div key={project.id} onClick={() => handleProjectClick(project.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer group ${activeProjectId === String(project.id) ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold' : 'text-slate-600 hover:bg-white/60'}`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: project.color }}>
                    <DynamicIcon name={project.icon || 'Briefcase'} size={16} />
                  </div>
                  <span className="flex-1 truncate text-sm">{project.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {permissions.canEditProject && (
                      <button onClick={(e) => openEdit(e, project)} className="p-1 hover:bg-white rounded-md text-slate-400"><Edit2 size={12} /></button>
                    )}
                    {permissions.canDeleteProject && (
                      <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} className="p-1 hover:bg-white rounded-md text-slate-400"><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="px-3 pt-6 py-2 border-t border-slate-100 mt-4"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System</span></div>
        {permissions.canViewUsers && (
          <button onClick={() => handleManagementClick('users')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${activeView === 'users' ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold' : 'text-slate-600 hover:bg-white/60'}`}>
            <UserCheck size={20} /> <span className="text-sm">Personnel</span>
          </button>
        )}
        <button onClick={() => handleManagementClick('profile')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${activeView === 'profile' ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold' : 'text-slate-600 hover:bg-white/60'}`}>
          <Settings size={20} /> <span className="text-sm">Profile</span>
        </button>
      </nav>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in duration-200 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingProject ? 'Modify Project' : 'New Project'}</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Project configuration</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Name</label>
                  <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all" placeholder="Project name" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl outline-none font-medium text-slate-700 transition-all h-24 resize-none" placeholder="Notes about this project..." />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Project Icon</label>
                  <div className="grid grid-cols-6 gap-3 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                    {AVAILABLE_ICONS.map(iconName => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={(e) => handleIconSelect(e, iconName)}
                        className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-center group ${
                          selectedIcon === iconName 
                            ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] scale-105 shadow-md' 
                            : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <div className="pointer-events-none">
                          <DynamicIcon name={iconName} size={18} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-[var(--primary)] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-[var(--primary)]/20 hover:opacity-90 transition-all active:scale-[0.98] relative z-30">
                  {editingProject ? 'Update Project' : 'Add Project'}
                </button>
              </form>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-20">
              <div className="grid grid-cols-2 gap-x-12 gap-y-12 -rotate-12 scale-150">
                <Hotel size={100} />
                <Bed size={100} />
                <ConciergeBell size={100} />
                <Building2 size={100} />
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
