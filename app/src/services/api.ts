const API_BASE = import.meta.env.VITE_API_URL || '/api';

type ApiResponse<T> = { data: T; _offline?: false } | { _offline: true; data?: never };

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
  plannedFeatures?: string[];
}

export interface PaymentMethod {
  id: string; network: string; chainId: number; token: string; tokenAddress: string; decimals: number; confirmations: number;
  explorer: string; rpcUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number };
}
export interface TreasuryConfig { EVM: string; paymentMethods: PaymentMethod[]; }
export interface PaymentIntent {
  id: string; plan: 'pro' | 'vip'; cycle: 'monthly' | 'yearly'; method: string; chain_id: number; token: string; token_address: string;
  token_decimals: number; payer_address: string; treasury_address: string; amount_usd: string; amount_units: string;
  duration_days: number; required_confirmations: number; status: 'pending' | 'confirmed'; tx_hash: string | null;
  created_at: string; expires_at: string; confirmed_at?: string;
}
export interface PremiumSignal {
  id?: string; _id?: string; type?: string; pair?: string; symbol?: string;
  entry?: string | number; price?: string | number; target?: string | number; takeProfit?: string | number;
  stopLoss?: string | number; stop_loss?: string | number; confidence?: string | number; timeframe?: string; interval?: string; indicator?: string; rsi?: number;
}
export interface ClientApiKey { id: string; name: string; suffix: string; created_at: string; expires_at: string; revoked_at?: string | null; last_used_at?: string | null; }
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
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
  try { const user = raw ? JSON.parse(raw) : null; return user && typeof user.id === 'string' ? user : null; } catch { return null; }
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
  options: RequestInit = {},
  timeoutMs = 8000
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
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(body.error || `HTTP ${res.status}`,res.status,body.code);
    }
    const data = await res.json();
    return { data } as ApiResponse<T>;
  } catch (err: any) {
    if (
      err.name === 'AbortError' || err.name === 'TimeoutError' ||
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
    forgotPassword: (email: string) =>
      request<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (email: string, code: string, newPassword: string) =>
      request<{ success: boolean; message: string; user: User; token: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword }),
      }),
    me: () => request<{ user: User | null }>('/auth/me'),
    walletNonce: (address: string, purpose: 'login' | 'link' = 'login') =>
      request<{ nonce: string }>(`/auth/wallet/nonce?address=${encodeURIComponent(address)}&purpose=${purpose}`),
    walletLink: (address: string, signature: string, nonce: string) => request<{ user: User; token: string }>('/auth/wallet/link', { method: 'POST',body: JSON.stringify({address,signature,nonce}) }),
    walletVerify: (address: string, signature: string, nonce: string) =>
      request<{ user: User; token: string }>('/auth/wallet/verify', {
        method: 'POST',
        body: JSON.stringify({ address, signature, nonce }),
      }),
  },

  billing: {
    getPlans: () => request<{ version?: number; plans: Plan[]; treasury: TreasuryConfig }>('/billing/plans'),
    createIntent: (data: { plan: 'pro' | 'vip'; cycle: 'monthly' | 'yearly'; method: string }) => request<{ intent: PaymentIntent }>('/billing/intents',{ method: 'POST',body: JSON.stringify(data) }),
    intents: () => request<{ intents: PaymentIntent[] }>('/billing/intents'),
    submitTx: (data: { intentId: string; txHash: string }) => request<{ success: boolean; status: 'pending' | 'confirmed'; intent?: PaymentIntent; confirmations?: number; required?: number; message?: string; user?: User }>('/billing/submit-tx',{ method: 'POST',body: JSON.stringify(data) },30000),
    keys: () => request<{ keys: ClientApiKey[] }>('/client-api/keys'),
    createKey: (name: string) => request<{ key: string; details: ClientApiKey }>('/client-api/keys',{ method: 'POST',body: JSON.stringify({name}) }),
    revokeKey: (id: string) => request<{ revoked: boolean }>(`/client-api/keys/${encodeURIComponent(id)}`,{ method: 'DELETE' }),
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
    get: () => request<{ news: any[]; _stale?: boolean; _fallback?: boolean; _cached?: boolean }>('/news'),
  },

  signals: {
    get: () => request<{ signals: PremiumSignal[] }>('/signals'),
  },
};
