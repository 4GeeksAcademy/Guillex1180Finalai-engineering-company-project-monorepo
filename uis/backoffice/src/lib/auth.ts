'use client';

export const TOKEN_KEY = 'trackflow_access_token';
export const USER_UUID_KEY = 'trackflow_user_uuid';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getUserUuid(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(USER_UUID_KEY) ?? '';
}

export function saveSession(token: string, userUuid: string): void {
  // The API client adds the Authorization scheme, so store only the token value.
  window.localStorage.setItem(TOKEN_KEY, token.trim().replace(/^Bearer\s+/i, ''));
  window.localStorage.setItem(USER_UUID_KEY, userUuid.trim());
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_UUID_KEY);
}
