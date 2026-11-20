import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TrackFlow — Talent Pipeline Tracker',
  description: 'Gestión de candidaturas para TrackFlow Tech',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h1 className="text-xl font-bold">Talent Pipeline Tracker</h1>
              <p className="text-xs opacity-80">TrackFlow Tech — Zaragoza</p>
            </div>
            <nav className="ml-auto flex gap-4 text-sm">
              <a href="/" className="hover:underline underline-offset-2">Candidaturas</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-gray-800 text-gray-400 text-center py-3 text-xs">
          TrackFlow · Talent Pipeline Tracker · {new Date().getFullYear()}
        </footer>
      </body>
    </html>
  )
}