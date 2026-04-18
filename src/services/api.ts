import * as SecureStore from 'expo-secure-store';
import { AfaqError, apiErrorFromResponse, ErrorCode } from './errors';

const API_URL = process.env.API_URL || 'https://afaq-api.example.com';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number; // ms
}

const DEFAULT_TIMEOUT = 30_000;

class AfaqApi {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await SecureStore.getItemAsync('jwt_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const headers = await this.getHeaders();
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;

    // AbortController for timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method || 'GET',
        headers: { ...headers, ...options.headers },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (e: any) {
      clearTimeout(timer);
      if (e.name === 'AbortError') {
        throw new AfaqError({
          code: ErrorCode.NETWORK_TIMEOUT,
          message: `Request to ${endpoint} timed out after ${timeout}ms`,
          retryable: true,
          originalError: e,
        });
      }
      // Network error (offline, DNS failure, etc.)
      throw new AfaqError({
        code: ErrorCode.NETWORK_OFFLINE,
        message: 'Network request failed — check your connection',
        retryable: true,
        originalError: e,
      });
    } finally {
      clearTimeout(timer);
    }

    // Parse body (may fail for non-JSON responses)
    let body: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await response.json().catch(() => ({}));
    } else {
      body = {};
    }

    // Handle errors with typed AfaqError
    if (!response.ok) {
      // 401 → clear token, let auth store handle redirect
      if (response.status === 401) {
        await SecureStore.deleteItemAsync('jwt_token');
      }
      throw apiErrorFromResponse(response.status, body, `Request to ${endpoint} failed`);
    }

    return body as T;
  }

  /**
   * Retry wrapper with exponential backoff.
   * Only retries on retryable errors (5xx, timeouts, network).
   */
  async requestWithRetry<T>(
    endpoint: string,
    options: ApiOptions = {},
    maxRetries = 3,
  ): Promise<T> {
    let lastError: AfaqError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.request<T>(endpoint, options);
      } catch (e) {
        if (!(e instanceof AfaqError) || !e.retryable || attempt === maxRetries) {
          throw e;
        }
        lastError = e;
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    throw lastError;
  }

  // ─── Auth ───────────────────────────────────────────────

  async login(phone: string, pin: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { phone, pin },
    });
  }

  // ─── Dashboard ──────────────────────────────────────────

  async getTodayKPIs() {
    return this.requestWithRetry<{
      sales: number;
      newLeads: number;
      whatsappMessages: number;
      voiceCalls: number;
    }>('/dashboard/kpis/today');
  }

  async getModuleStatus() {
    return this.requestWithRetry<{
      modules: Array<{
        key: string;
        name: string;
        status: 'green' | 'yellow' | 'red';
        lastPing: string;
      }>;
    }>('/system/modules/status');
  }

  // ─── WhatsApp ───────────────────────────────────────────

  async getWhatsAppThreads(limit = 50) {
    return this.requestWithRetry<{
      threads: Array<{
        id: string;
        contactName: string;
        lastMessage: string;
        lastMessageAt: string;
        unreadCount: number;
        avatarUrl?: string;
      }>;
    }>(`/whatsapp/threads?limit=${limit}`);
  }

  async getWhatsAppMessages(threadId: string, limit = 100) {
    return this.request<{
      messages: Array<{
        id: string;
        content: string;
        direction: 'inbound' | 'outbound';
        timestamp: string;
        mediaUrl?: string;
      }>;
    }>(`/whatsapp/threads/${threadId}/messages?limit=${limit}`);
  }

  // ─── Voice ─────────────────────────────────────────────

  async executeVoiceCommand(transcript: string) {
    return this.request<{
      action: string;
      result: string;
      data?: any;
    }>('/voice/execute', {
      method: 'POST',
      body: { transcript },
      timeout: 60_000, // Voice commands may take longer
    });
  }

  // ─── CRM ───────────────────────────────────────────────

  async getLeads(limit = 100) {
    return this.requestWithRetry<{
      leads: Array<{
        id: string;
        name: string;
        phone: string;
        status: string;
        lastContact: string;
        source: string;
      }>;
    }>(`/crm/leads?limit=${limit}`);
  }

  // ─── Sync ──────────────────────────────────────────────

  async applySyncItem(item: {
    action: string;
    payload: any;
    client_timestamp: number;
    client_id: number;
  }) {
    return this.request<{
      status: 'applied' | 'conflict' | 'rejected';
      server_timestamp?: number;
    }>('/sync/apply', {
      method: 'POST',
      body: item,
    });
  }
}

export const api = new AfaqApi(API_URL);