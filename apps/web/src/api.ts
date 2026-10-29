import type { DrawingFile, Preferences } from '@fabwcie/free-drawing';

/** User logged in */
export type User = { id: string; name: string; email: string };

/**
 * Drawing of the user, without its content: `version` of its content, increased by each save of it (none from servers of
 * previous versions)
 */
export type DrawingSummary = { id: string; name: string; createdAt: string; updatedAt: string; version?: number };

/** Drawings of a user: of their account on server (`api`), or of the browser (`localDrawings`) */
export type DrawingsStore = {
  /** Last updated first */
  listDrawings(): Promise<DrawingSummary[]>;
  createDrawing(drawing: { name?: string; content?: DrawingFile }): Promise<DrawingSummary>;
  getDrawing(id: string): Promise<DrawingSummary & { content: DrawingFile }>;
  /**
   * Name and / or content changed: a content given with the `version` it changed is refused (ApiError 409) when the
   * drawing was saved since (another tab, another device)
   */
  updateDrawing(id: string, changes: { name?: string; content?: DrawingFile; version?: number }): Promise<DrawingSummary>;
  deleteDrawing(id: string): Promise<unknown>;
};

/**
 * Error of the server: message, HTTP status and code (Better Auth errors)
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

/**
 * Request to the server of this page (session cookie sent), JSON body and response
 */
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    ...(body !== undefined && { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) throw new ApiError(data?.message ?? data?.error ?? res.statusText, res.status, data?.code);
  return data as T;
}

const drawingPath = (id: string) => `/api/drawings/${encodeURIComponent(id)}`;

/**
 * Accounts (`/api/auth`, Better Auth) and API of logged in users (see apps/server)
 */
export const api = {
  /** User of the session, ApiError 401 when not logged in */
  me: () => request<User>('/api/me'),
  signIn: (email: string, password: string) => request('/api/auth/sign-in/email', 'POST', { email, password }),
  signUp: (name: string, email: string, password: string) =>
    request('/api/auth/sign-up/email', 'POST', { name, email, password }),
  signOut: () => request('/api/auth/sign-out', 'POST', {}),
  updateUser: (name: string) => request('/api/auth/update-user', 'POST', { name }),
  /** Not changed (no error) when an account uses this email */
  changeEmail: (newEmail: string) => request('/api/auth/change-email', 'POST', { newEmail }),
  /** Other sessions signed out */
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/api/auth/change-password', 'POST', { currentPassword, newPassword, revokeOtherSessions: true }),
  /** Account removed with its drawings and preferences, session ended */
  deleteUser: (password: string) => request('/api/auth/delete-user', 'POST', { password }),
  getPreferences: () => request<Partial<Preferences>>('/api/preferences'),
  savePreferences: (preferences: Preferences) => request('/api/preferences', 'PUT', preferences),
  listDrawings: () => request<DrawingSummary[]>('/api/drawings'),
  createDrawing: (drawing: { name?: string; content?: DrawingFile }) =>
    request<DrawingSummary>('/api/drawings', 'POST', drawing),
  getDrawing: (id: string) => request<DrawingSummary & { content: DrawingFile }>(drawingPath(id)),
  updateDrawing: (id: string, changes: { name?: string; content?: DrawingFile; version?: number }) =>
    request<DrawingSummary>(drawingPath(id), 'PUT', changes),
  deleteDrawing: (id: string) => request<null>(drawingPath(id), 'DELETE'),
};
