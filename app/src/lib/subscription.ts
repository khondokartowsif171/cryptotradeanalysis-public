import type { User } from '@/services/api';
export function activeTier(user: User | null | undefined, now = Date.now()): 'free' | 'pro' | 'vip' {
  return user && (user.tier === 'pro' || user.tier === 'vip') && new Date(user.tier_expires_at || 0).getTime() > now ? user.tier : 'free';
}
export const openPlans = () => window.dispatchEvent(new Event('cryptox:pricing'));
export const openSignIn = () => window.dispatchEvent(new Event('cryptox:signin'));
