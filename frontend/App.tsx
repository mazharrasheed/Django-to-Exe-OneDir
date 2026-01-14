
import React, { useState, useEffect, useMemo } from 'react';
import { User, Project, Transaction, AppTheme, TransactionType } from './types';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import CalendarView from './components/CalendarView';
import TransactionModal from './components/TransactionModal';
import DayDetailModal from './components/DayDetailModal';
import Login from './components/Login';
import EmptyState from './components/EmptyState';
import ProjectHeader from './components/ProjectHeader';
import UserManagement from './components/UserManagement';
import ProfileSettings from './components/ProfileSettings';
import ReportsView from './components/ReportsView';
import { Loader2, AlertTriangle, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { apiService } from './services/apiService';
import { format } from 'date-fns';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { hi } from 'date-fns/locale';

const AppContent: React.FC = () => {
  const { user, token, isLoading: authLoading, logout, permissions, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isInitializing, setIsInitializing] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [initialRedirectDone, setInitialRedirectDone] = useState(false);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('income');
  const [isGeneralEntrySession, setIsGeneralEntrySession] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Project Deletion states
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const theme: AppTheme = user?.theme || 'slate';

  // React example
useEffect(() => {
  const checkLicense = () => {
    fetch("http://127.0.0.1:8000/api/license/check/")
      .then(res => {
        if (res.status === 403) {
          window.location.replace("/license/activate/");
        }
      });
  };


  const handleExportCSV = () => {
    if (transactions.length === 0 && projects.length === 0) return;
    const headers = ["Project", "Date", "Type", "Amount", "Note"];
    const rows = transactions.map(t => {
      const p = projects.find(proj => String(proj.id) === String(t.project));
      return [t.project === null ? 'General' : (p?.name || "Archived"), t.date, t.type.toUpperCase(), t.amount, t.note];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  checkLicense();                 // on app load
  const id = setInterval(checkLicense, 10000); // every 10s

  return () => clearInterval(id);
}, []);


  const activeProjectId = useMemo(() => {
    const match = location.pathname.match(/\/project\/([^/]+)/);
    return match ? String(match[1]) : null;
  }, [location.pathname]);

  const activeView = useMemo(() => {
    if (location.pathname.startsWith('/users')) return 'users';
    if (location.pathname.startsWith('/profile')) return 'profile';
    if (location.pathname.startsWith('/reports')) return 'reports';
    return 'dashboard';
  }, [location.pathname]);

  // Redirect non-superusers to profile on login/root access (only once per session)
  useEffect(() => {
    if (!authLoading && user && !user.is_superuser && location.pathname === '/' && !initialRedirectDone) {
      setInitialRedirectDone(true);
      navigate('/profile', { replace: true });
    }
  }, [user, authLoading, location.pathname, navigate, initialRedirectDone]);

  useEffect(() => {
    if (!token || authLoading) {
      if (!authLoading && !token) {
        setIsInitializing(false);
      }
      return;
    }

    const loadData = async () => {
      setIsInitializing(true);
      try {
        // Can load projects if we can view dashboard OR project list OR reports
        const canViewData = permissions.canViewProjects || permissions.canViewDashboard || permissions.canViewReports;

        if (!canViewData) {
          setIsInitializing(false);
          return;
        }

        const [apiProjects, apiTransactions] = await Promise.all([
          permissions.canViewProjects ? apiService.fetchProjects() : Promise.resolve([]),
          permissions.canViewTransactions ? apiService.fetchTransactions() : Promise.resolve([])
        ]);
        
        const sortedProjects = [...apiProjects].sort((a, b) => {
          if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
          return Number(b.id) - Number(a.id);
        });
        
        setProjects(sortedProjects);
        setTransactions(apiTransactions);
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setIsInitializing(false);
      }
    };

    loadData();
  }, [token, authLoading, permissions]);

  const activeProject = useMemo(() => 
    projects.find(p => String(p.id) === activeProjectId) || null
  , [projects, activeProjectId]);

  const globalBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === 'investment') return acc;
      const isOutflow = t.type === 'expense';
      return acc + (isOutflow ? -t.amount : t.amount);
    }, 0);
  }, [transactions]);

  const globalInvestment = useMemo(() => {
    return transactions.reduce((acc, t) => acc + (t.type === 'investment' ? t.amount : 0), 0);
  }, [transactions]);

  const handleAddProject = async (name: string, description: string, icon: string) => {
    try {
      const newProject = await apiService.createProject(name, description, icon);
      setProjects(prev => [newProject, ...prev]);
      navigate(`/project/${newProject.id}`);
    } catch (err) {
      alert('Error creating project. Check API connection.');
    }
  };

  const handleUpdateProject = async (id: string, name: string, description: string, icon: string) => {
    try {
      const updated = await apiService.updateProject(id, name, description, icon);
      setProjects(prev => prev.map(p => String(p.id) === String(id) ? updated : p));
    } catch (err) {
      alert('Error updating project.');
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDeleteId) return;
    setIsDeletingProject(true);
    try {
      await apiService.deleteProject(projectToDeleteId);
      setProjects(prev => prev.filter(p => String(p.id) !== String(projectToDeleteId)));
      setTransactions(prev => prev.filter(t => String(t.project) !== String(projectToDeleteId)));
      if (activeProjectId === String(projectToDeleteId)) navigate('/');
      setProjectToDeleteId(null);
    } catch (err) {
      alert('Cloud synchronization failed.');
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'project'>) => {
    const payload: any = {
      ...data,
      project: isGeneralEntrySession ? null : activeProjectId
    };
    
    try {
      const newTransaction = await apiService.createTransaction(payload);
      setTransactions(prev => [...prev, newTransaction]);
      setIsModalOpen(false);
    } catch (err) {
      alert('Error saving transaction.');
    }
  };

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const updated = await apiService.updateTransaction(id, updates);
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      alert('Error updating transaction.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await apiService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Error deleting transaction.');
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0 && projects.length === 0) return;
    const headers = ["Project", "Date", "Type", "Amount", "Note"];
    const rows = transactions.map(t => {
      const p = projects.find(proj => String(proj.id) === String(t.project));
      return [t.project === null ? 'General' : (p?.name || "Archived"), t.date, t.type.toUpperCase(), t.amount, t.note];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const openGeneralEntry = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setModalType('income');
    setIsGeneralEntrySession(true);
    setIsModalOpen(true);
  };

  const openEntryModal = (type: TransactionType, date: string) => {
    setModalType(type);
    setSelectedDate(date);
    setIsGeneralEntrySession(false);
    setIsModalOpen(true);
  };

  if (authLoading || (token && isInitializing)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    
    <div className={`flex h-screen bg-slate-50 text-slate-900 overflow-hidden relative font-['Inter'] theme-${theme}`}>
      <Sidebar 
        projects={projects} 
        activeProjectId={activeProjectId} 
        onSelectProject={(id) => { 
          setIsSidebarOpen(false); 
          if (id) navigate(`/project/${id}`);
          else navigate('/');
        }} 
        onAddProject={handleAddProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={(id) => setProjectToDeleteId(id)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={activeView}
        onSetView={(view) => navigate(view === 'dashboard' ? '/' : `/${view}`)}
      />
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <Navbar 
          onToggleSidebar={() => setIsSidebarOpen(true)}
          user={user}
          onLogout={logout}
          onExport={handleExportCSV}
          globalBalance={globalBalance}
          globalInvestment={globalInvestment}
          onSetView={(view) => navigate(view === 'dashboard' ? '/' : `/${view}`)}
          onGeneralEntry={openGeneralEntry}
        />
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">


          <Routes >
            <Route path="/license/activate" element={<>License Activation</>} />
            <Route path="/users" element={permissions.canViewUsers ? <UserManagement /> : <Navigate to="/" />} />
            <Route path="/profile" element={<ProfileSettings activeUser={user} onUpdateUser={updateUser} />} />
            <Route path="/reports" element={
              permissions.canViewReports ? (
                <ReportsView transactions={transactions} projects={projects} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                   <Lock size={40} className="text-slate-300 mb-4" />
                   <h2 className="text-2xl font-black text-slate-800">Restricted Access</h2>
                   <p className="text-slate-500 font-medium">You do not have permission to view the ledger.</p>
                </div>
              )
            } />
            <Route path="/project/:projectId" element={
              <div className="max-w-7xl mx-auto h-full space-y-6">
                {permissions.canViewProjects ? (
                  activeProject ? (
                    <>
                      <ProjectHeader 
                        project={activeProject} 
                        transactions={transactions.filter(t => String(t.project) === activeProjectId)}
                        onAddInvestment={() => openEntryModal('investment', format(new Date(), 'yyyy-MM-dd'))}
                      />
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <CalendarView 
                          projectId={activeProjectId!}
                          transactions={transactions.filter(t => String(t.project) === activeProjectId || t.project === null)}
                          onAddTransaction={openEntryModal}
                          onOpenDayDetail={(date) => { setSelectedDate(date); setIsDayDetailOpen(true); }}
                          onDeleteTransaction={handleDeleteTransaction}
                          activeProject={activeProject}
                          user={user}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-slate-400 font-black">Project not found.</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                     <Lock size={40} className="text-slate-300 mb-4" />
                     <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
                     <p className="text-slate-500 font-medium">You cannot view individual project details.</p>
                  </div>
                )}
              </div>
            } />
            <Route path="/" element={
              <div className="max-w-7xl mx-auto h-full">
                {permissions.canViewDashboard ? (
                  <EmptyState 
                    onOpenSidebar={() => setIsSidebarOpen(true)} 
                    globalBalance={globalBalance}
                    projectCount={projects.length}
                    projects={projects}
                    transactions={transactions}
                    onSelectProject={(id) => navigate(`/project/${id}`)}
                    theme={theme}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                      <Lock size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Access Restricted</h2>
                    <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
                      You do not have permission to view the project hub.
                    </p>
                  </div>
                )}
              </div>
            } />
          </Routes>
        </div>
      </main>

      {projectToDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl border border-slate-100 relative overflow-hidden text-center">
             <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Delete Project?</h3>
             <p className="text-slate-500 font-medium mb-8 leading-relaxed">Permanently remove this project and all history.</p>
             <div className="flex flex-col gap-3">
                <button disabled={isDeletingProject} onClick={confirmDeleteProject} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">
                  {isDeletingProject ? <Loader2 size={20} className="animate-spin" /> : "Confirm Deletion"}
                </button>
                <button onClick={() => setProjectToDeleteId(null)} className="w-full py-4 text-slate-400 font-black">Keep Project</button>
             </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <TransactionModal 
          key={`${modalType}-${selectedDate}-${isGeneralEntrySession}`}
          type={modalType} 
          isGeneral={isGeneralEntrySession}
          date={selectedDate!} 
          onClose={() => { setIsModalOpen(false); }} 
          onSubmit={handleAddTransaction} 
        />
      )}

      {isDayDetailOpen && selectedDate && (
        <DayDetailModal 
          date={selectedDate} 
          transactions={transactions.filter(t => (String(t.project) === activeProjectId || t.project === null) && t.date === selectedDate)} 
          onClose={() => setIsDayDetailOpen(false)} 
          onUpdate={handleUpdateTransaction} 
          onDelete={handleDeleteTransaction} 
          onAdd={openEntryModal} 
          user={user}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  </AuthProvider>
);

export const DynamicIcon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const Icon = (LucideIcons as any)[name] || LucideIcons.Briefcase;
  return <Icon size={size} className={className} />;
};

export default App;
