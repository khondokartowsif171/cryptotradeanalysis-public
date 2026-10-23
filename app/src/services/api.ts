const API_BASE = import.meta.env.VITE_API_URL || 'https://cryptox-api.auraajenticai.cloud';

type ApiResponse<T> = { data: T; _offline?: false } | { _offline: true };

export interface User {
  id: string;
  email: string;
  wallet_address?: string;
  tier?: string;
  tier_expires_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  priceUsd: number;
  badge: string;
  period?: string;
  yearlyPriceUsd?: number;
  features: string[];
}

export interface TreasuryConfig {
  EVM: string;
  TRON: string;
  acceptedTokens: { symbol: string; networks: string[] }[];
}

function getToken(): string | null {
  return localStorage.getItem('cryptox_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('cryptox_token', token);
  else localStorage.removeItem('cryptox_token');
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('cryptox_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: User | null) {
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
      request<{ user: User; token: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    login: (email: string, password: string) =>
      request<{ user: User; token: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    me: () => request<{ user: User | null }>('/auth/me'),
    walletNonce: (address: string) =>
      request<{ nonce: string }>(`/auth/wallet/nonce?address=${encodeURIComponent(address)}`),
    walletVerify: (address: string, signature: string, nonce: string) =>
      request<{ user: User; token: string }>('/auth/wallet/verify', {
        method: 'POST',
        body: JSON.stringify({ address, signature, nonce }),
      }),
  },

  billing: {
    getPlans: () => request<{ plans: Plan[]; treasury: TreasuryConfig }>('/billing/plans'),
    submitTx: (data: { plan: string; txHash: string; token: string; network: string }) =>
      request<{ success: boolean; message: string; tier: string; order: any }>('/billing/submit-tx', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
