/**
 * Frontend TelemetryService — cola local con batch y retry.
 *
 * Fases:
 *  1. Acumula eventos en una cola en memoria.
 *  2. Cada 10 s o al llegar a 20 eventos, envía lote vía POST.
 *  3. Al cambiar visibilidad (navigator.sendBeacon), envía cola pendiente.
 *  4. Reintenta con backoff exponencial (máx 3 intentos).
 *
 * Uso:
 *   import { track } from '@/lib/telemetry';
 *   track('page_viewed', { path: '/backoffice/inventory' });
 */

const ENDPOINT =
  (process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT ?? '/trackflow-api/telemetry/events').replace(/\/$/, '') +
  '/telemetry/events';

/** Máximo de eventos por lote antes de forzar un envío. */
const BATCH_MAX = 20;

/** Intervalo fijo entre envíos programados (ms). */
const FLUSH_INTERVAL_MS = 10_000;

/** Número máximo de reintentos con backoff. */
const MAX_RETRIES = 3;

/** Retardo base para backoff exponencial (ms). */
const BASE_DELAY_MS = 1_000;

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface TelemetryEnvelope {
  eventId: string;
  timestamp: string;
  sessionId: string | null;
  userId: string | null;
  event_type: string;
  schemaVersion: string;
  requestId: string | null;
  properties: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Estado del servicio
// ---------------------------------------------------------------------------

let queue: TelemetryEnvelope[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let _sessionId: string | null = null;
let _userId: string | null = null;

function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = crypto.randomUUID();
  }
  return _sessionId;
}

function getUserId(): string | null {
  // Lee desde localStorage (misma clave que auth lib)
  if (!_userId && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('trackflow_user_uuid');
      _userId = raw && raw !== 'null' ? raw : null;
    } catch {
      _userId = null;
    }
  }
  return _userId;
}

// ---------------------------------------------------------------------------
// Envío con retry (backoff exponencial)
// ---------------------------------------------------------------------------

async function sendBatch(events: TelemetryEnvelope[]): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
      if (res.ok) return true;
      // 4xx no se reintenta (error del cliente)
      if (res.status >= 400 && res.status < 500) {
        console.warn('[Telemetry] Rejected by server (status %d), dropping batch', res.status);
        return true; // consideramos "enviado" para no acumular
      }
    } catch (err) {
      console.warn('[Telemetry] Network error (attempt %d/3): %s', attempt + 1, err);
    }
    // Backoff: 1s, 2s, 4s
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, BASE_DELAY_MS * 2 ** attempt));
    }
  }
  console.error('[Telemetry] All %d retries exhausted — dropping batch', MAX_RETRIES);
  return false;
}

// ---------------------------------------------------------------------------
// Vaciado de cola
// ---------------------------------------------------------------------------

async function flush(): Promise<void> {
  if (queue.length === 0) return;

  const batch = queue;
  queue = [];
  await sendBatch(batch);
}

// ---------------------------------------------------------------------------
// Beacon — se usa al cerrar / cambiar pestaña
// ---------------------------------------------------------------------------

function flushViaBeacon(): void {
  if (queue.length === 0) return;

  const batch = queue;
  queue = [];
  try {
    const sent = navigator.sendBeacon(ENDPOINT, JSON.stringify({ events: batch }));
    if (!sent) {
      console.warn('[Telemetry] sendBeacon returned false — re-queueing');
      queue = batch;
    }
  } catch (err) {
    console.warn('[Telemetry] sendBeacon error:', err);
    queue = batch;
  }
}

// ---------------------------------------------------------------------------
// Inicialización
// ---------------------------------------------------------------------------

function ensureStarted(): void {
  if (flushTimer !== null) return;

  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);

  if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushViaBeacon();
      }
    });
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Registra un evento de telemetría. Es seguro llamarlo desde cualquier
 * parte de la aplicación — encola y envía en segundo plano.
 */
export function track(
  eventType: string,
  properties: Record<string, unknown> = {},
): void {
  ensureStarted();

  const envelope: TelemetryEnvelope = {
    eventId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    userId: getUserId(),
    event_type: eventType,
    schemaVersion: '1.0.0',
    requestId: null,
    properties,
  };

  queue.push(envelope);

  if (queue.length >= BATCH_MAX) {
    // Lanzamos el flush sin await para no bloquear al caller
    flush();
  }
}

/**
 * Fuerza el envío inmediato de la cola pendiente.
 * Útil antes de navegaciones críticas o tests.
 */
export async function flushNow(): Promise<void> {
  await flush();
}