
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { UserPlus, Trash2, Shield, Mail, Key, UserCheck, X, Loader2, AlertCircle, UserCircle, CheckCircle2, Edit3, Hotel, Bed, Building2, Coffee } from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const REQUIRED_PERMISSIONS = [
  { codename: 'data_backup', name: 'Can data bckup', group: 'User Management' },
  { codename: 'add_user', name: 'Can add user', group: 'User Management' },
  { codename: 'change_user', name: 'Can change user', group: 'User Management' },
  { codename: 'delete_user', name: 'Can delete user', group: 'User Management' },
  { codename: 'view_user', name: 'Can view user', group: 'User Management' },
  { codename: 'add_project', name: 'Can add project', group: 'Project Management' },
  { codename: 'change_project', name: 'Can change project', group: 'Project Management' },
  { codename: 'delete_project', name: 'Can delete project', group: 'Project Management' },
  { codename: 'view_project', name: 'Can view project', group: 'Project Management' },
  { codename: 'add_transaction', name: 'Can add transaction', group: 'Transaction Management' },
  { codename: 'change_transaction', name: 'Can change transaction', group: 'Transaction Management' },
  { codename: 'delete_transaction', name: 'Can delete transaction', group: 'Transaction Management' },
  { codename: 'view_transaction', name: 'Can view transaction', group: 'Transaction Management' },
  { codename: 'view_dashboard', name: 'Can view dashboard', group: 'Custom Views' },
  { codename: 'view_balance_sheet', name: 'Can view balance sheet', group: 'Custom Views' },
  { codename: 'view_reports', name: 'Can view reports', group: 'Custom Views' },
  { codename: 'view_project_balance', name: 'Can view balance', group: 'Custom Views' },
  { codename: 'view_project_investment', name: 'Can view investment', group: 'Custom Views' },
];

const UserManagement: React.FC = () => {
  const { user: currentAdmin, permissions } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    permissions: [] as string[] 
  });
  
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await apiService.fetchUsers();
      setUsers(usersData);
    } catch (err) {
      console.error("User load failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const resetForm = () => {
    setFormData({ username: '', first_name: '', last_name: '', email: '', password: '', confirm_password: '', permissions: [] });
    setEditingUser(null);
    setShowAddForm(false);
    setError(null);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '', 
      confirm_password: '',
      permissions: Array.isArray(user.permission_details) ? user.permission_details.map((p: any) => p.codename) : []
    });
    setShowAddForm(true);
  };

  const togglePermission = (codename: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(codename) ? prev.permissions.filter(p => p !== codename) : [...prev.permissions, codename]
    }));
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editingUser) {
      if (!formData.password) return setError("Password required.");
      if (formData.password !== formData.confirm_password) return setError("Passwords mismatch.");
    }
    setIsSubmitting(true);
    try {
      const payload: any = { username: formData.username, first_name: formData.first_name, last_name: formData.last_name, email: formData.email, permissions: formData.permissions };
      if (formData.password) payload.password = formData.password;
      editingUser ? await apiService.updateUser(editingUser.id, payload) : await apiService.createUser(payload);
      await loadUsers();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save personnel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { canAddUser, canEditUser, canDeleteUser } = permissions;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Personnel Directory</h2>
          <p className="text-slate-400 font-medium">Manage exactly 18 system permissions and project access.</p>
        </div>
        {canAddUser && (
          <button onClick={() => { resetForm(); setShowAddForm(true); }} className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl">
            <UserPlus size={18} /> Register Personnel
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" /></div>
      ) : (
        <div className="grid gap-6">
          {users.map((u: any) => (
            <div key={u.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex items-center gap-6 group hover:border-indigo-100 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${u.is_staff || u.is_superuser ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {u.is_staff || u.is_superuser ? <Shield size={24} /> : <UserCircle size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}</h3>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-1"><Mail size={12} /> {u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEditUser && <button onClick={() => handleEdit(u)} className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"><Edit3 size={18} /></button>}
                {canDeleteUser && <button onClick={async () => { if (confirm("Remove user?")) { await fetch(`https://aliandco.pythonanywhere.com/api/users/${u.id}/`, { method: 'DELETE', headers: { 'Authorization': `Token ${localStorage.getItem('ff_token')}` } }); loadUsers(); } }} className="p-3 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-0 w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingUser ? 'Modify Personnel' : 'Register Personnel'}</h3>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">Personnel Access Management</p>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmitUser} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {error && <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold border border-rose-100">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="First Name" value={formData.first_name} onChange={e => setFormData(p => ({...p, first_name: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-xs" />
                <input required placeholder="Last Name" value={formData.last_name} onChange={e => setFormData(p => ({...p, last_name: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Username" value={formData.username} onChange={e => setFormData(p => ({...p, username: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-xs" />
                <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="password" placeholder="Password" required={!editingUser} value={formData.password} onChange={e => setFormData(p => ({...p, password: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-xs" />
                <input type="password" placeholder="Confirm" required={!!formData.password} value={formData.confirm_password} onChange={e => setFormData(p => ({...p, confirm_password: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-xs" />
              </div>

              <div className="pt-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 border-b border-slate-50 pb-2">System Permissions (17 Total)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {REQUIRED_PERMISSIONS.map(perm => (
                    <label key={perm.codename} className="flex items-center gap-3 cursor-pointer group py-0.5">
                      <div className="relative flex items-center">
                        <input type="checkbox" checked={formData.permissions.includes(perm.codename)} onChange={() => togglePermission(perm.codename)} className="peer appearance-none w-4 h-4 rounded border-2 border-slate-200 checked:bg-indigo-600 checked:border-indigo-600 transition-all" />
                        <CheckCircle2 size={10} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-tight transition-colors ${formData.permissions.includes(perm.codename) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                        {perm.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button disabled={isSubmitting} onClick={handleSubmitUser} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (editingUser ? 'Update Records' : 'Register User')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
