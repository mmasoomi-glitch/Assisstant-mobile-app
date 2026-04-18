/**
 * AFAQ Offline Sync Worker
 *
 * Background process that drains the sync_queue when connectivity returns.
 * Implements conflict resolution: server-wins for reads, queue-wins for writes.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { api } from './api';
import {
  getSyncQueue,
  clearSyncedQueue,
  cacheLeads,
  cacheWhatsAppThreads,
} from '../stores/offlineStore';
import { useOfflineStore } from '../stores/offlineStore';

// ─── Conflict Resolution Strategy ───────────────────────────────
// "Last-Writer-Wins with server authority"
//
// Rules:
//   1. Offline writes are queued with client_timestamp
//   2. On sync, server applies each write in queue order
//   3. If server has a newer version of the same record,
//      the client's write is flagged as CONFLICT
//   4. Conflicts surface to the user in a "Sync Issues" panel
//   5. Server data always wins for reads (pull overwrites cache)
// ─────────────────────────────────────────────────────────────────

interface SyncResult {
  synced: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

interface QueueItem {
  id: number;
  action: string;
  payload: string;
  created_at: number;
}

class SyncWorker {
  private isSyncing = false;
  private unsubscribe: (() => void) | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000;
  private readonly SYNC_INTERVAL_MS = 30_000; // 30s background poll

  /**
   * Start listening for connectivity changes.
   * Automatically syncs when connection is restored.
   */
  start(): void {
    // Listen for network state changes
    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = state.isConnected === true && state.isInternetReachable !== false;
      useOfflineStore.getState().setOnline(isOnline);

      if (isOnline) {
        this.sync();
      }
    });

    // Also poll periodically for background sync
    this.syncInterval = setInterval(() => {
      const { isOnline } = useOfflineStore.getState();
      if (isOnline) {
        this.sync();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  stop(): void {
    this.unsubscribe?.();
    if (this.syncInterval) clearInterval(this.syncInterval);
  }

  /**
   * Main sync loop:
   *   1. Drain queued offline writes
   *   2. Pull fresh data from server → overwrite cache
   *   3. Report conflicts
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0, conflicts: 0, errors: ['Already syncing'] };
    }

    this.isSyncing = true;
    const result: SyncResult = { synced: 0, failed: 0, conflicts: 0, errors: [] };

    try {
      // Phase 1: Drain offline write queue
      const queue = getSyncQueue(50) as QueueItem[];
      const processedIds: number[] = [];

      for (const item of queue) {
        const payload = JSON.parse(item.payload);
        let attempts = 0;
        let synced = false;

        while (attempts < this.MAX_RETRIES && !synced) {
          try {
            const response = await api.request<any>('/sync/apply', {
              method: 'POST',
              body: {
                action: item.action,
                payload,
                client_timestamp: item.created_at,
                client_id: item.id,
              },
            });

            if (response.status === 'conflict') {
              result.conflicts++;
              result.errors.push(
                `Conflict on ${item.action} (ID ${item.id}): server version is newer`
              );
              processedIds.push(item.id); // Remove from queue — conflict logged server-side
              synced = true;
            } else {
              processedIds.push(item.id);
              result.synced++;
              synced = true;
            }
          } catch (e: any) {
            attempts++;
            if (attempts >= this.MAX_RETRIES) {
              result.failed++;
              result.errors.push(`Failed ${item.action} (ID ${item.id}): ${e.message}`);
            } else {
              // Exponential backoff
              await this.delay(this.RETRY_DELAY_MS * Math.pow(2, attempts - 1));
            }
          }
        }
      }

      // Remove synced/failed items from queue
      if (processedIds.length > 0) {
        clearSyncedQueue(processedIds);
      }

      // Phase 2: Pull fresh data → overwrite cache
      try {
        const [leadsData, threadsData] = await Promise.all([
          api.getLeads(100),
          api.getWhatsAppThreads(50),
        ]);
        cacheLeads(leadsData.leads);
        cacheWhatsAppThreads(threadsData.threads);
      } catch (e: any) {
        // Pull failure is non-fatal — cached data still valid
        result.errors.push(`Pull refresh failed: ${e.message}`);
      }

      // Phase 3: Update pending count
      useOfflineStore.getState().refreshPendingCount();

      // Haptic on successful sync
      if (result.synced > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Manual sync trigger (pull-to-refresh or settings button).
   */
  async forcSync(): Promise<SyncResult> {
    const { isOnline } = useOfflineStore.getState();
    if (!isOnline) {
      return { synced: 0, failed: 0, conflicts: 0, errors: ['Device is offline'] };
    }
    return this.sync();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const syncWorker = new SyncWorker();