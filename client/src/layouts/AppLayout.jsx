import { Outlet } from 'react-router-dom';
import { Menu, Vault } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import CommandPalette from '../components/CommandPalette.jsx';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-base">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="glass-panel flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 lg:hidden">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/[0.05] hover:text-slate-100"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-gradient shadow-glow">
              <Vault size={15} className="text-white" />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">InterviewVault</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}