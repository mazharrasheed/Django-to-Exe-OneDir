
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { User, Permissions } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: Permissions;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  hasPerm: (perm: string, appLabel?: string) => boolean;
  refreshUser: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export  const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ff_token'));
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const initializationRef = useRef(false);

  const normalizePermissions = (permsArray: any[]): Permissions => {
    const perms: Permissions = {};
    if (Array.isArray(permsArray)) {
      permsArray.forEach(p => {
        if (p.codename) {
          perms[p.codename] = true;
          if (p.app_label) {
            perms[`${p.app_label}.${p.codename}`] = true;
          }
        }
      });
    }

    const isSuper = !!perms.is_superuser;

    // 1. User Management (4)
    perms.canAddUser = isSuper || !!(perms.add_user || perms['auth.add_user']);
    perms.canEditUser = isSuper || !!(perms.change_user || perms['auth.change_user']);
    perms.canDeleteUser = isSuper || !!(perms.delete_user || perms['auth.delete_user']);
    perms.canViewUsers = isSuper || !!(perms.view_user || perms['auth.view_user']);

    // 2. Project Management (4)
    perms.canAddProject = isSuper || !!(perms.add_project || perms['finance.add_project']);
    perms.canEditProject = isSuper || !!(perms.change_project || perms['finance.change_project']);
    perms.canDeleteProject = isSuper || !!(perms.delete_project || perms['finance.delete_project']);
    perms.canViewProjects = isSuper || !!(perms.view_project || perms['finance.view_project']);

    // 3. Transaction Management (4)
    perms.canAddTransaction = isSuper || !!(perms.add_transaction || perms['finance.add_transaction']);
    perms.canEditTransaction = isSuper || !!(perms.change_transaction || perms['finance.change_transaction']);
    perms.canDeleteTransaction = isSuper || !!(perms.delete_transaction || perms['finance.delete_transaction']);
    perms.canViewTransactions = isSuper || !!(perms.view_transaction || perms['finance.view_transaction']);

    // 4. Custom Views (5)
    perms.canBackup = isSuper || !!(perms.view_dashboard || perms['finance.data_backup']);
    perms.canViewDashboard = isSuper || !!(perms.view_dashboard || perms['finance.view_dashboard']);
    perms.canViewBalanceSheet = isSuper || !!(perms.view_balance_sheet || perms['finance.view_balance_sheet']);
    perms.canViewReports = isSuper || !!(perms.view_reports || perms['finance.view_reports']);
    perms.canViewProjectBalance = isSuper || !!(perms.view_project_balance || perms['finance.view_project_balance']);
    perms.canViewProjectInvestment = isSuper || !!(perms.view_project_investment || perms['finance.view_project_investment']);

    return perms;
  };

  const fetchUserData = useCallback(async (authToken: string) => {
    if (!authToken) return false;
    try {
      const [userResponse, userPermsResponse] = await Promise.all([
        authService.getCurrentUser(authToken),
        authService.getPermissions(authToken)
      ]);

      const userData = Array.isArray(userResponse) ? userResponse[0] : userResponse;
      if (!userData) throw new Error("Invalid user data");

      const firstName = userData.first_name || userData.username || 'User';
      const lastName = userData.last_name || '';
      const rawPerms = userPermsResponse?.permissions || [];
      console.log(rawPerms)
      const normalizedPerms = normalizePermissions(rawPerms);

      setUser({
        ...userData,
        name: `${firstName} ${lastName}`.trim(),
        permissions: normalizedPerms
      });
      setPermissions(normalizedPerms);
      return true;
    } catch (err) {
      console.error("Auth initialization failed:", err);
      setToken(null);
      localStorage.removeItem('ff_token');
      return false;
    }
  }, []);

  useEffect(() => {
    if (initializationRef.current) return;
    const init = async () => {
      if (token) await fetchUserData(token);
      setIsLoading(false);
      initializationRef.current = true;
    };
    init();
  }, [token, fetchUserData]);

  const login = async (newToken: string) => {
    setIsLoading(true);
    localStorage.setItem('ff_token', newToken);
    setToken(newToken);
    await fetchUserData(newToken);
    setIsLoading(false);
  };

  const logout = () => {

    authService.logout(token); // You might want to adjust parameters as needed  
    localStorage.removeItem('ff_token');
    setToken(null);
    setUser(null);
    setPermissions({});
    initializationRef.current = false;
  };

  const hasPerm = (perm: string, appLabel?: string): boolean => {
    if (user?.is_superuser) return true;
    if (appLabel) return !!permissions[`${appLabel}.${perm}`] || !!permissions[perm];
    return !!permissions[perm];
  };

  const refreshUser = async () => { if (token) await fetchUserData(token); };
  const updateUser = (updatedUser: User) => { setUser(updatedUser); };

  return (
    <AuthContext.Provider value={{ user, token, permissions, isLoading, login, logout, hasPerm, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
export default AuthProvider; // ✅ default is a component
