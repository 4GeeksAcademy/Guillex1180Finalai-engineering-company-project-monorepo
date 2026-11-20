'use client';

export default function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="text-center py-16">
      <div
        className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"
        role="status"
        aria-label={label}
      />
      <p className="text-gray-500">{label}</p>
    </div>
  );
}