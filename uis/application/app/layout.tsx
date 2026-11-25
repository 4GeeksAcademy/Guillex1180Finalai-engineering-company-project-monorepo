import type { Metadata } from 'next';
import './globals.css';
import TelemetryInit from '@/components/TelemetryInit';

export const metadata: Metadata = {
  title: 'TrackFlow | Backoffice de inventario',
  description: 'Gestión operativa de inventario de TrackFlow',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
    <TelemetryInit />
    {children}
  </body></html>;
}
