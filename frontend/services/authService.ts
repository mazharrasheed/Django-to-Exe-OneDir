import { Database } from "lucide-react";

const API_BASE = `http://127.0.0.1:8000`;

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.non_field_errors?.[0] || "The credentials provided are incorrect.");
    }
    return data;
  }

  if (res.ok) {
    return null;
  }

  if (res.status >= 500) {
    throw new Error("The server is currently undergoing maintenance. Please try again shortly.");
  }

  const text = await res.text().catch(() => "");
  throw new Error(`Connection issue (${res.status}). Please try again.`);
};

/**
 * Common wrapper for fetch to catch network-level errors like "Failed to fetch"
 */
const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    return await fetch(url, options);
  } catch (err: any) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error("Could not connect to the management server. Please check your internet connection or try again later.");
    }
    throw err;
  }
};


async function handlechangepaswordResponse(res: Response) {
  let payload: any = null;
  try {
    payload = await res.json();
  } catch (e) {
    // fallback if response has no JSON
    payload = { detail: res.statusText };
  }

  if (!res.ok) {
    // bubble up error with status + payload
    throw {
      status: res.status,
      message: payload?.detail || "Unknown error",
      payload,
    };
  }

  return payload;
}

export const authService = {
  login: async (username: string, password: string) => {
    const res = await safeFetch(`${API_BASE}/api-token-auth/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

   logout: async (token: string) => {
    const res = await safeFetch(`${API_BASE}/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' 
        , 'Authorization': `Token ${token}`
      },
    });
  },

  getCurrentUser: async (token: string) => {
    if (!token) return null;
    try {
      const res = await safeFetch(`${API_BASE}/api/current_user/`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      return await handleResponse(res);
    } catch (e) {
      console.warn("getCurrentUser failed:", e);
      return null;
    }
  },

  getPermissions: async (token: string) => {
    if (!token) return {};
    try {
      const res = await safeFetch(`${API_BASE}/api/users/me/permissions/`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      return await handleResponse(res) || {};
    } catch (e) {
      console.warn("getPermissions failed:", e);
      return {};
    }
  },

  

  changePassword: async (token: string, data: any) => {
    if (!token) throw new Error("Authentication token required");
    const res = await safeFetch(`${API_BASE}/api/change-password/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      },
      body: JSON.stringify(data),
    });
    return handlechangepaswordResponse(res);
  },

  forgotPassword: async (email: string) => {
    const res = await safeFetch(`${API_BASE}/api/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  resetPassword: async (token: string, data: any) => {
    const res = await safeFetch(`${API_BASE}/api/reset-password/${token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }
};
