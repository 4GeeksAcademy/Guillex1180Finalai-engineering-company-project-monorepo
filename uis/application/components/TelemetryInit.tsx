'use client';

/**
 * Componente de inicialización de telemetría.
 *
 * Se monta una vez en el root layout e instala:
 *  - `track('backoffice_page_viewed')` en cada navegación
 *  - `window.onerror` → `track('frontend_error_captured', ...)`
 *  - `window.onunhandledrejection` → `track('frontend_error_captured', ...)`
 *  - PerformanceObserver para LCP, FID, CLS
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/telemetry';

/** Convierte una ruta Next.js a un nombre de vista permitido por el schema. */
function mapPathToView(path: string): string {
  if (path.startsWith('/backoffice/inventory/products')) return 'inventory_products';
  if (path.startsWith('/backoffice/inventory/orders/inbound')) return 'inventory_inbound';
  if (path.startsWith('/backoffice/inventory/orders/outbound')) return 'inventory_outbound';
  if (path.startsWith('/backoffice/inventory/orders')) return 'inventory_history';
  if (path.startsWith('/backoffice/incidents')) return 'incidents';
  if (path.startsWith('/backoffice/suppliers')) return 'suppliers';
  if (path.startsWith('/backoffice/users')) return 'users';
  if (path.startsWith('/login')) return 'login';
  return 'other_allowlisted';
}

/** Fingerprint simple: hash sanitizado de un string de error. */
function simpleFingerprint(input: unknown): string {
  const str = String(input ?? '').replace(/\d+/g, 'N').slice(0, 200);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  // Normalizar a hex de 16+ chars
  return ('0000000000000000' + (hash >>> 0).toString(16)).slice(-16);
}

export default function TelemetryInit() {
  const pathname = usePathname();

  // --- Page view tracking ---
  useEffect(() => {
    const id = setTimeout(() => {
      track('backoffice_page_viewed', {
        view: mapPathToView(pathname),
        client_version: '1.0.0',
      });
    }, 100);
    return () => clearTimeout(id);
  }, [pathname]);

  // --- Unhandled errors & rejections (solo una vez) ---
  useEffect(() => {
    const originalOnError = window.onerror;

    window.onerror = (msg, source, line, col, error) => {
      track('frontend_error_captured', {
        error_fingerprint: simpleFingerprint(msg),
        view: mapPathToView(pathname),
        client_version: '1.0.0',
        severity: 'error',
      });
      originalOnError?.call(window, msg, source, line, col, error);
    };

    const handler = (event: PromiseRejectionEvent) => {
      track('frontend_error_captured', {
        error_fingerprint: simpleFingerprint(event.reason),
        view: mapPathToView(pathname),
        client_version: '1.0.0',
        severity: 'error',
      });
    };
    window.addEventListener('unhandledrejection', handler);

    return () => {
      window.onerror = originalOnError;
      window.removeEventListener('unhandledrejection', handler);
    };
  }, []);

  // --- Web Vitals (LCP, FID, CLS) ---
  useEffect(() => {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const entry = entries[entries.length - 1];
          track('frontend_page_load_recorded', {
            view: mapPathToView(pathname),
            client_version: '1.0.0',
            duration_ms: entry.startTime,
            navigation_type: 'initial_load',
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          track('frontend_page_load_recorded', {
            view: mapPathToView(pathname),
            client_version: '1.0.0',
            duration_ms: fidEntry.processingStart - fidEntry.startTime,
            navigation_type: 'initial_load',
          });
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const layoutShift = entry as LayoutShift;
          if (!layoutShift.hadRecentInput) clsValue += layoutShift.value;
        }
        if (clsValue > 0) {
          track('frontend_page_load_recorded', {
            view: mapPathToView(pathname),
            client_version: '1.0.0',
            duration_ms: clsValue,
            navigation_type: 'initial_load',
          });
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    } catch {
      // PerformanceObserver no disponible — ignorar
    }
  }, []);

  return null;
}

// Fragmento necesario para que TypeScript conozca LayoutShift (API de PerformanceObserver)
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}