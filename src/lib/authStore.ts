// Client-side auth store using localStorage
// Backend integration point: Replace with JWT/session-based auth

import { User, UserRole } from './mockData';

const AUTH_KEY = 'hapo_auth_user';

export function saveAuthUser(user: User): void {
  if (typeof window === 'undefined') return;
  const { password: _pw, ...safeUser } = user;
  localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));
}

export function getAuthUser(): Omit<User, 'password'> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export function getUserRole(): UserRole | null {
  const user = getAuthUser();
  return user?.role ?? null;
}
