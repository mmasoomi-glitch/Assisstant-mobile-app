/**
 * AFAQ Typed Error Hierarchy
 *
 * Every API error is wrapped in a domain-specific error class
 * so the UI can render contextual messages without string-matching.
 */

export enum ErrorCode {
  // Auth
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_BIOMETRIC_UNAVAILABLE = 'AUTH_BIOMETRIC_UNAVAILABLE',
  AUTH_BIOMETRIC_FAILED = 'AUTH_BIOMETRIC_FAILED',
  AUTH_NO_STORED_TOKEN = 'AUTH_NO_STORED_TOKEN',

  // Network
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR = 'NETWORK_SERVER_ERROR',

  // Modules
  MODULE_NOT_SUBSCRIBED = 'MODULE_NOT_SUBSCRIBED',
  MODULE_TRIAL_EXPIRED = 'MODULE_TRIAL_EXPIRED',

  // Sync
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  SYNC_QUEUE_FULL = 'SYNC_QUEUE_FULL',

  // Voice
  VOICE_MICROPHONE_DENIED = 'VOICE_MICROPHONE_DENIED',
  VOICE_STT_FAILED = 'VOICE_STT_FAILED',
  VOICE_TTS_FAILED = 'VOICE_TTS_FAILED',

  // Generic
  UNKNOWN = 'UNKNOWN',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
}

export interface ErrorMeta {
  code: ErrorCode;
  message: string;
  status?: number;
  module?: string;
  upgradeUrl?: string;
  retryable?: boolean;
  originalError?: unknown;
}

export class AfaqError extends Error {
  readonly code: ErrorCode;
  readonly status?: number;
  readonly module?: string;
  readonly upgradeUrl?: string;
  readonly retryable: boolean;
  readonly originalError?: unknown;

  constructor(meta: ErrorMeta) {
    super(meta.message);
    this.name = 'AfaqError';
    this.code = meta.code;
    this.status = meta.status;
    this.module = meta.module;
    this.upgradeUrl = meta.upgradeUrl;
    this.retryable = meta.retryable ?? false;
    this.originalError = meta.originalError;
  }

  /** User-facing message suitable for Alert/toast display */
  get displayMessage(): string {
    switch (this.code) {
      case ErrorCode.AUTH_EXPIRED:
        return 'Your session has expired. Please sign in again.';
      case ErrorCode.AUTH_INVALID_CREDENTIALS:
        return 'Invalid phone number or PIN.';
      case ErrorCode.NETWORK_OFFLINE:
        return 'You are offline. Changes will sync when connection returns.';
      case ErrorCode.NETWORK_TIMEOUT:
        return 'Request timed out. Please try again.';
      case ErrorCode.MODULE_NOT_SUBSCRIBED:
        return `This feature requires the ${this.module || 'module'} subscription.`;
      case ErrorCode.MODULE_TRIAL_EXPIRED:
        return `Your ${this.module || 'module'} trial has ended. Subscribe to continue.`;
      case ErrorCode.SYNC_CONFLICT:
        return 'Some data was updated on another device. Check Sync Issues.';
      case ErrorCode.VOICE_MICROPHONE_DENIED:
        return 'Microphone access is required for voice commands.';
      case ErrorCode.VOICE_STT_FAILED:
        return 'Could not understand the audio. Please try again.';
      default:
        return this.message || 'Something went wrong. Please try again.';
    }
  }

  toJSON(): ErrorMeta {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      module: this.module,
      upgradeUrl: this.upgradeUrl,
      retryable: this.retryable,
    };
  }
}

/**
 * Factory: Convert a raw fetch Response + parsed body into an AfaqError.
 */
export function apiErrorFromResponse(
  status: number,
  body: any,
  fallbackMessage?: string,
): AfaqError {
  // Module gating (402)
  if (status === 402 && body?.code === 'module_not_subscribed') {
    return new AfaqError({
      code: ErrorCode.MODULE_NOT_SUBSCRIBED,
      message: body.message || fallbackMessage || 'Module not subscribed',
      status,
      module: body.module,
      upgradeUrl: body.upgrade_url,
      retryable: false,
    });
  }

  // Auth (401)
  if (status === 401) {
    return new AfaqError({
      code: ErrorCode.AUTH_EXPIRED,
      message: body?.message || 'Authentication expired',
      status,
      retryable: false,
    });
  }

  // Not found (404)
  if (status === 404) {
    return new AfaqError({
      code: ErrorCode.NOT_FOUND,
      message: body?.message || 'Resource not found',
      status,
      retryable: false,
    });
  }

  // Validation (422)
  if (status === 422) {
    return new AfaqError({
      code: ErrorCode.VALIDATION,
      message: body?.message || 'Invalid request data',
      status,
      retryable: false,
    });
  }

  // Server error (5xx)
  if (status >= 500) {
    return new AfaqError({
      code: ErrorCode.NETWORK_SERVER_ERROR,
      message: body?.message || fallbackMessage || 'Server error',
      status,
      retryable: true,
    });
  }

  // Catch-all
  return new AfaqError({
    code: ErrorCode.UNKNOWN,
    message: body?.message || fallbackMessage || `HTTP ${status}`,
    status,
    retryable: status >= 500,
  });
}