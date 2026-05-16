const API_BASE = import.meta.env.VITE_API_URL || '';

type ApiResponse<T> = { data: T; _offline?: false } | { _offline: true };

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

export function clearAuth() {
  setToken(null);
  setStoredUser(null);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!API_BASE) return { _offline: true };

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return { data } as ApiResponse<T>;
  } catch (err: any) {
    if (
      err.name === 'AbortError' ||
      err.message === 'Failed to fetch' ||
      err.message?.includes('Failed to fetch')
    ) {
      return { _offline: true };
    }
    throw err;
  }
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ user: { id: string; email: string }; token: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    login: (email: string, password: string) =>
      request<{ user: { id: string; email: string }; token: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    me: () => request<{ user: { id: string; email: string } | null }>('/auth/me'),
  },

  watchlist: {
    get: () => request<{ watchlist: string[] }>('/watchlist'),
    save: (coin_ids: string[]) =>
      request<{ watchlist: string[] }>('/watchlist', {
        method: 'PUT',
        body: JSON.stringify({ coin_ids }),
      }),
  },

  portfolio: {
    get: () => request<{ portfolio: any[] }>('/portfolio'),
    save: (holdings: any[]) =>
      request<{ portfolio: any[] }>('/portfolio', {
        method: 'PUT',
        body: JSON.stringify({ holdings }),
      }),
  },

  subscribe: (email: string) =>
    request<{ success: boolean }>('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  news: {
    get: () => request<{ news: any[] }>('/news'),
  },

  signals: {
    get: () => request<{ signals: any[] }>('/signals'),
  },
};
