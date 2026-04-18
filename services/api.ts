// Mirror of frontend/src/services/api.ts ApiResponse envelope.
// Keep in sync with backend app/core/api_response.py.

import Constants from "expo-constants";

export type ApiResponse<T = unknown> = {
  ok: boolean;
  data: T | null;
  error: { code: string; message?: string; required_env?: string[] } | null;
  pagination: { page: number; per_page: number; total: number } | null;
  request_id: string;
  timestamp: string;
  version: string;
};

const BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ||
  "https://afaq24.store.ngrok.pizza";

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  return (await r.json()) as ApiResponse<T>;
}
