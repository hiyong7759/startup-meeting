import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">스타트업 회의실</h1>
        <div className="flex items-center gap-4">
          <Link
            to="/settings"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Settings
          </Link>
          <div className="text-sm text-gray-400">v0.1</div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
