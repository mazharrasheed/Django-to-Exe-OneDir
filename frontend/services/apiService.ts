
import { Project, Transaction, User } from '../types';

const PYTHON_ANYWHERE_USERNAME = 'aliandco'; 
const API_BASE = `http://127.0.0.1:8000/api`;

const getHeaders = () => {
  const token = localStorage.getItem('ff_token');
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Token ${token}`;
  return headers;
};

/**
 * Robustly handles API responses to prevent crashes on non-JSON errors (like 500 HTML)
 */
const handleFetchResponse = async (res: Response, fallbackMsg: string) => {
  if (!res.ok) {
    if (res.status >= 500) {
      throw new Error("The server is currently having trouble processing this request. Please try again in a few moments.");
    }
    
    try {
      const errorData = await res.json();
      // Handle Django-style error objects
      const message = errorData.detail || 
                      errorData.non_field_errors?.[0] || 
                      (typeof errorData === 'object' ? Object.values(errorData)[0] : null) || 
                      fallbackMsg;
      
      throw new Error(Array.isArray(message) ? message[0] : message);
    } catch (e: any) {
      if (e.message.includes("server is currently having trouble")) throw e;
      throw new Error(`${fallbackMsg} (Status ${res.status})`);
    }
  }
  
  try {
    return await res.json();
  } catch (e) {
    return null; // For successful 204 No Content responses
  }
};

/**
 * Common wrapper for fetch to catch network-level errors like "Failed to fetch"
 */
const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error("Communication with the server was lost. Please verify your connection or try again.");
    }
    throw err;
  }
};

export const apiService = {
  fetchProjects: async (): Promise<Project[]> => {
    try {
      const res = await safeFetch(`${API_BASE}/projects/`, { headers: getHeaders() });
      return await handleFetchResponse(res, 'Failed to fetch projects');
    } catch (error) {
      console.error('API fetchProjects failed:', error);
      return [];
    }
  },

  createProject: async (name: string, description: string, icon: string): Promise<Project> => {
    const projectData = {
      name,
      description,
      icon,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
    };
    const res = await safeFetch(`${API_BASE}/projects/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData),
    });
    return handleFetchResponse(res, 'Could not create project');
  },

  updateProject: async (id: string, name: string, description: string, icon: string): Promise<Project> => {
    const res = await safeFetch(`${API_BASE}/projects/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ name, description, icon }),
    });
    return handleFetchResponse(res, 'Could not update project');
  },

  deleteProject: async (id: string): Promise<void> => {
    const res = await safeFetch(`${API_BASE}/projects/${id}/`, { 
      method: 'DELETE',
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Could not delete project');
  },

  fetchTransactions: async (): Promise<Transaction[]> => {
    try {
      const res = await safeFetch(`${API_BASE}/transactions/`, { headers: getHeaders() });
      const data = await handleFetchResponse(res, 'Failed to fetch transactions');
      return (data || []).map((t: any) => ({ ...t, amount: Number(t.amount) }));
    } catch (error) {
      console.error('API fetchTransactions failed:', error);
      return [];
    }
  },

  createTransaction: async (data: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const payload: any = { ...data };
    if (!payload.project) delete payload.project;
    payload.amount = parseFloat(payload.amount.toString()).toFixed(2);

    const res = await safeFetch(`${API_BASE}/transactions/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const t = await handleFetchResponse(res, 'Could not add transaction');
    return { ...t, amount: Number(t.amount) };
  },

  updateTransaction: async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
    const res = await safeFetch(`${API_BASE}/transactions/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const t = await handleFetchResponse(res, 'Could not update transaction');
    return { ...t, amount: Number(t.amount) };
  },

  deleteTransaction: async (id: string): Promise<void> => {
    const res = await safeFetch(`${API_BASE}/transactions/${id}/`, { 
      method: 'DELETE',
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Could not delete transaction');
  },

  fetchUsers: async (): Promise<User[]> => {
    try {
      const res = await safeFetch(`${API_BASE}/users/`, { headers: getHeaders() });
      return await handleFetchResponse(res, 'Failed to fetch personnel list');
    } catch (error) {
      console.error('API fetchUsers failed:', error);
      return [];
    }
  },

  createUser: async (userData: any): Promise<User> => {
    const res = await safeFetch(`${API_BASE}/users/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleFetchResponse(res, 'Failed to register personnel');
  },

  updateUser: async (id: string | number, userData: any): Promise<User> => {
    const res = await safeFetch(`${API_BASE}/users/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleFetchResponse(res, 'Failed to update personnel records');
  },

  fetchAvailablePermissions: async (): Promise<any[]> => {
    try {
      const res = await safeFetch(`${API_BASE}/users/me/permissions/`, { headers: getHeaders() });
      console.log(res)
      const data = await handleFetchResponse(res, 'Failed to sync permissions');
      return data?.permissions || [];
    } catch (error) {
      console.error('API fetchAvailablePermissions failed:', error);
      return [];
    }
  }
}
