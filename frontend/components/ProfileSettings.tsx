
import React, { useState, useRef, useEffect } from 'react';
import { User, AppTheme } from '../types';
import { Shield, Lock, Check, Loader2, UserCheck, Camera, Trash2, MapPin, Phone, Globe, Info, Edit3, Image as ImageIcon, ChevronDown, ChevronUp, Palette, CheckCircle2, XCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import { authService } from '..//services/authService';
import { useAuth } from '../context/AuthContext';

const extractApiErrorMessage = (error: any): string => {
  console.error("API Error:", error);

  if (!error) return "Unexpected error occurred";

  // DRF structured errors nested under payload.errors
  if (error.payload && error.payload.errors && typeof error.payload.errors === "object") {
    return Object.entries(error.payload.errors)
      .map(([field, messages]) =>
        Array.isArray(messages)
          ? `${field.replace(/_/g, " ")}: ${messages.join(", ")}`
          : `${field}: ${messages}`,
      )
      .join(" | ");
  }

  // Sometimes error.message is set
  if (typeof error.message === "string") {
    return error.message;
  }

  return "Request failed. Please try again.";
};


interface ProfileSettingsProps {
  activeUser: User;
  onUpdateUser: (user: User) => void;
}

interface DjangoPermission {
  codename: string;
  name: string;
  app_label: string;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ activeUser, onUpdateUser }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<DjangoPermission[]>([]);
  const [isLoadingPerms, setIsLoadingPerms] = useState(true);
  const { token } = useAuth();

  const [profileData, setProfileData] = useState({
    name: activeUser.name || '',
    bio: activeUser.bio || '',
    location: activeUser.location || '',
    phoneNumber: activeUser.phoneNumber || '',
    website: activeUser.website || '',
  });
 
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileData({
      name: activeUser.name || '',
      bio: activeUser.bio || '',
      location: activeUser.location || '',
      phoneNumber: activeUser.phoneNumber || '',
      website: activeUser.website || '',
    });

    const fetchPerms = async () => {
      try {
        const perms = await apiService.fetchAvailablePermissions();
        // Show relevant auth and finance permissions
        const allowedApps = ['finance', 'auth'];
        const relevantPerms = Array.isArray(perms)
          ? perms.filter(
            (p: any) =>
              p &&
              p.codename &&
              p.app_label &&
              allowedApps.includes(p.app_label.toLowerCase())
          )
          : [];
        setAvailablePermissions(relevantPerms);
      } catch (err) {
        console.error("Failed to load permissions list:", err);
      } finally {
        setIsLoadingPerms(false);
      }
    };

    fetchPerms();
  }, [activeUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File exceeds 2MB limit.' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateUserProfile({ [type === 'avatar' ? 'avatar' : 'coverImage']: base64String });
        setMessage({ type: 'success', text: `${type === 'avatar' ? 'Profile picture' : 'Cover image'} updated!` });
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (type: 'avatar' | 'cover') => {
    updateUserProfile({ [type === 'avatar' ? 'avatar' : 'coverImage']: undefined });
    setMessage({ type: 'success', text: `${type === 'avatar' ? 'Profile picture' : 'Cover image'} removed.` });
  };

  const updateUserProfile = (updates: Partial<User>) => {
    const updatedUser = { ...activeUser, ...updates };
    onUpdateUser(updatedUser);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      updateUserProfile(profileData);
      setMessage({ type: 'success', text: 'Information updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Update failed.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      console.log("paswor change")
      console.log(oldPassword, newPassword, confirmPassword)
      await authService.changePassword(token,
        {
          old_password: oldPassword,
          new_password1: newPassword,
          new_password2: confirmPassword
        }
      );
      setMessage({ type: 'success', text: 'Password update request submitted!' });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (err: any) {
      console.error('Password change failed:', err);
      console.log(extractApiErrorMessage(err))
      setMessage({
        type: 'error',
        text: extractApiErrorMessage(err)
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleThemeChange = (theme: AppTheme) => {
    updateUserProfile({ theme });
    setMessage({ type: 'success', text: `App theme changed to ${theme}!` });
  };

  const themes: { id: AppTheme, name: string, color: string }[] = [
    { id: 'indigo', name: 'Professional Indigo', color: 'bg-indigo-600' },
    { id: 'emerald', name: 'Financial Emerald', color: 'bg-emerald-600' },
    { id: 'rose', name: 'Dynamic Rose', color: 'bg-rose-600' },
    { id: 'amber', name: 'Hospitality Amber', color: 'bg-amber-600' },
    { id: 'slate', name: 'Executive Slate', color: 'bg-slate-900' }
  ];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 font-['Inter'] pb-20">
      <div className="relative mb-32 md:mb-40">
        <div className="h-48 md:h-72 w-full bg-slate-200 rounded-[2.5rem] overflow-hidden relative group border border-slate-100 shadow-inner">
          {activeUser.coverImage ? (
            <img src={activeUser.coverImage} className="w-full h-full object-cover" alt="Cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80">
              <ImageIcon size={48} className="text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={() => coverInputRef.current?.click()} className="px-4 py-2 bg-white/90 rounded-xl text-slate-800 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-lg">
              <Camera size={14} /> Change Cover
            </button>
            {activeUser.coverImage && (
              <button onClick={() => removeImage('cover')} className="p-2 bg-rose-500/90 rounded-xl text-white hover:bg-rose-600 transition-all shadow-lg">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <input type="file" ref={coverInputRef} onChange={(e) => handleFileChange(e, 'cover')} className="hidden" accept="image/*" />
        </div>

        <div className="absolute -bottom-20 md:-bottom-24 left-8 md:left-12 flex items-end gap-6">
          <div className="relative group">
            <div className={`w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] ring-8 ring-slate-50 overflow-hidden flex items-center justify-center shadow-2xl ${activeUser.avatar ? 'bg-white' : 'bg-indigo-600 text-white'}`}>
              {activeUser.avatar ? (
                <img src={activeUser.avatar} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <UserCheck size={64} />
              )}
              <div onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera size={32} className="text-white" />
              </div>
            </div>
            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" accept="image/*" />
            {activeUser.avatar && (
              <button onClick={() => removeImage('avatar')} className="absolute top-1 right-1 p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="pb-6 hidden md:block">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{activeUser.name || 'Ali & Company User'}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1.5">
              {activeUser.is_superuser ? 'Super Administrator' : `${activeUser.role || 'Personnel'} Account`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10 md:mt-16">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Palette size={16} className="text-[var(--primary)]" /> System Themes
            </h3>
            <div className="space-y-3">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${activeUser.theme === t.id ? 'border-[var(--primary)] bg-slate-50' : 'border-transparent bg-slate-50/50 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${t.color}`} />
                    <span className={`text-xs font-black ${activeUser.theme === t.id ? 'text-slate-800' : 'text-slate-500'}`}>{t.name}</span>
                  </div>
                  {activeUser.theme === t.id && <Check size={16} className="text-[var(--primary)]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Shield size={16} className="text-indigo-600" /> Security Clearances
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {isLoadingPerms ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-300" /></div>
              ) : availablePermissions.length === 0 ? (
                <p className="text-center py-4 text-[10px] font-bold text-slate-300 uppercase italic">No system permissions found...</p>
              ) : availablePermissions.map(perm => {
                const hasPermission = activeUser.is_superuser || activeUser.permissions?.[perm.codename] || activeUser.permissions?.[`${perm.app_label}.${perm.codename}`];
                return (
                  <div
                    key={perm.codename}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${hasPermission ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-tight ${hasPermission ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {perm.name}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400 truncate leading-none mt-1">{perm.app_label}</p>
                    </div>
                    {hasPermission ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-slate-300 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--primary)] p-8 rounded-[2.5rem] text-white shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-2xl w-fit"><Shield size={24} /></div>
              <button
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
              >
                {isChangingPassword ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {isChangingPassword ? 'Cancel' : 'Security'}
              </button>
            </div>
            <h4 className="font-black text-lg mb-2">Security Hub</h4>
            {isChangingPassword && (
              <form onSubmit={handlePasswordChange} className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                <input type="password" name="old_password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Current Password" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-indigo-200/50 text-sm font-bold" />
                <input type="password" name="new_password1" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-indigo-200/50 text-sm font-bold" />
                <input type="password" name="new_password2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none placeholder:text-indigo-200/50 text-sm font-bold" />
                <button disabled={isUpdating} type="submit" className="w-full py-3 bg-white text-[var(--primary)] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">
                  Update Password
                </button>

                {message && (
                 setTimeout(() => { setMessage(null); }, 5000),
                <div className={`p-4 rounded-2xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                  {message.type === 'success' ? <Check size={18} /> : <Shield size={18} />}
                  {message.text}
                </div>
              )}
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Edit3 size={20} /></div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Personal Information</h3>
              </div>
            </div>

            <form onSubmit={handleSaveInfo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
                  <input required value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zone / Area</label>
                  <input value={profileData.location} onChange={e => setProfileData({ ...profileData, location: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Bio</label>
                <textarea value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl outline-none font-bold text-slate-700 transition-all h-32 resize-none" />
              </div>

              {message && (
                setTimeout(() => { setMessage(null); }, 5000),
                <div className={`p-4 rounded-2xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                  {message.type === 'success' ? <Check size={18} /> : <Shield size={18} />}
                  {message.text}
                </div>
              )}

              <button disabled={isUpdating} type="submit" className="w-full md:w-auto px-12 py-5 bg-[var(--primary)] hover:opacity-90 disabled:bg-slate-300 text-white rounded-2xl font-black text-base shadow-xl active:scale-[0.98] transition-all">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;