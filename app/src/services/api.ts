const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken(): string | null {
  return localStorage.getItem('cryptox_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('cryptox_token', token);
  else localStorage.removeItem('cryptox_token');
}

export function getStoredUser(): { id: string; email: string } | null {
  const raw = localStorage.getItem('cryptox_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: { id: string; email: string } | null) {
  if (user) localStorage.setItem('cryptox_user', JSON.stringify(user));
  else localStorage.removeItem('cryptox_user');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = API_BASE ? `${API_BASE}${path}` : path;

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.message.includes('Failed to fetch')) {
      return { _offline: true } as T;
    }
    throw err;
  }
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ user: any; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ user: any; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ user: any }>('/api/auth/me'),
  },
  watchlist: {
    get: () => request<{ watchlist: string[] }>('/api/watchlist'),
    save: (coin_ids: string[]) =>
      request<{ watchlist: string[] }>('/api/watchlist', {
        method: 'PUT',
        body: JSON.stringify({ coin_ids }),
      }),
  },
  portfolio: {
    get: () => request<{ portfolio: any[] }>('/api/portfolio'),
    save: (holdings: any[]) =>
      request<{ portfolio: any[] }>('/api/portfolio', {
        method: 'PUT',
        body: JSON.stringify({ holdings }),
      }),
  },
  subscribe: (email: string) =>
    request<{ success: boolean }>('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  news: {
    get: () => request<{ news: any[] }>('/api/news'),
  },
  signals: {
    get: () => request<{ signals: any[] }>('/api/signals'),
  },
};
