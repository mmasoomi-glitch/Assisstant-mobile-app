/**
 * AFAQ Offline Store — STUB
 *
 * Minimal stub to unblock syncWorker.ts compilation.
 * Replace with full SQLite-backed implementation when mobile app is built.
 */

import { create } from 'zustand';

// ─── Stub SQLite functions ───────────────────────────────

export function getSyncQueue(limit = 50): Array<{
  id: number;
  action: string;
  payload: string;
  created_at: number;
}> {
  console.warn('[offlineStore] getSyncQueue stub — returning empty');
  return [];
}

export function clearSyncedQueue(ids: number[]): void {
  console.warn('[offlineStore] clearSyncedQueue stub — no-op');
}

export function cacheLeads(leads: any[]): void {
  console.warn('[offlineStore] cacheLeads stub — no-op');
}

export function cacheWhatsAppThreads(threads: any[]): void {
  console.warn('[offlineStore] cacheWhatsAppThreads stub — no-op');
}

export function getCachedLeads(): any[] {
  console.warn('[offlineStore] getCachedLeads stub — returning empty');
  return [];
}

export function getCachedWhatsAppThreads(): any[] {
  console.warn('[offlineStore] getCachedWhatsAppThreads stub — returning empty');
  return [];
}

// ─── Zustand store ──────────────────────────────────────

interface OfflineState {
  isOnline: boolean;
  pendingSyncCount: number;
  setOnline: (online: boolean) => void;
  refreshPendingCount: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: true,
  pendingSyncCount: 0,
  setOnline: (online) => set({ isOnline: online }),
  refreshPendingCount: () => {
    const queue = getSyncQueue();
    set({ pendingSyncCount: queue.length });
  },
}));
