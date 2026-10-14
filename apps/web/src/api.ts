import type { DrawingFile, Preferences } from '@fabwcie/free-drawing';

/** User logged in */
export type User = { id: string; name: string; email: string };

/** Drawing of the user, without its content */
export type DrawingSummary = { id: string; name: string; createdAt: string; updatedAt: string };

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
  getPreferences: () => request<Partial<Preferences>>('/api/preferences'),
  savePreferences: (preferences: Preferences) => request('/api/preferences', 'PUT', preferences),
  listDrawings: () => request<DrawingSummary[]>('/api/drawings'),
  createDrawing: (drawing: { name?: string; content?: DrawingFile }) =>
    request<DrawingSummary>('/api/drawings', 'POST', drawing),
  getDrawing: (id: string) => request<DrawingSummary & { content: DrawingFile }>(drawingPath(id)),
  updateDrawing: (id: string, changes: { name?: string; content?: DrawingFile }) =>
    request<DrawingSummary>(drawingPath(id), 'PUT', changes),
  deleteDrawing: (id: string) => request<null>(drawingPath(id), 'DELETE'),
};
