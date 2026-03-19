import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">스타트업 회의실</h1>
        <div className="text-sm text-gray-400">v0.1</div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
