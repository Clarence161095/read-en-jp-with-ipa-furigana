export type AppRole = 'admin' | 'editor' | 'user';

export function canManageContent(role?: string | null): boolean {
  return role === 'admin' || role === 'editor';
}

export function canManageUsers(role?: string | null): boolean {
  return role === 'admin';
}

export function canEditOwnPassword(role?: string | null): boolean {
  return role === 'admin' || role === 'editor' || role === 'user';
}