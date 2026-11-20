'use client';

import Link from 'next/link';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

export default function ErrorDisplay({
  message,
  onRetry,
  backHref,
  backLabel,
}: ErrorDisplayProps) {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8">
        <p className="text-3xl mb-3">❌</p>
        <p className="text-red-700 font-medium mb-2">Error al cargar datos</p>
        <p className="text-red-500 text-sm mb-4">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          )}
          {backHref && (
            <Link
              href={backHref}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
            >
              {backLabel || 'Volver'}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}