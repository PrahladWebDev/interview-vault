import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Library, Building2, Layers, FolderKanban, GitBranch, BarChart3, Settings, Vault, ChevronsLeft, ChevronsRight, LogOut, Search, ClipboardList, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/library', label: 'Question Library', icon: Library },
  { to: '/collections', label: 'Collections', icon: FolderKanban },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/topics', label: 'Topics', icon: Layers },
  { to: '/graph', label: 'Graph View', icon: GitBranch },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/quiz', label: 'AI Quiz', icon: ClipboardList },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Mobile hamburger (in AppLayout) dispatches this to open the drawer.
  useEffect(() => {
    function onToggleRequest() {
      setMobileOpen((o) => !o);
    }
    window.addEventListener('toggle-mobile-sidebar', onToggleRequest);
    return () => window.removeEventListener('toggle-mobile-sidebar', onToggleRequest);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`glass-panel fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-white/[0.06] transition-transform duration-300 lg:static lg:z-auto lg:transition-[width] lg:duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'}`}
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gradient shadow-glow">
            <Vault size={18} className="text-white" />
          </div>
          {!collapsed && <span className="font-display text-lg font-semibold tracking-tight flex-1">InterviewVault</span>}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white/[0.05] hover:text-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

      <div className="px-3 pb-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.03] hover:text-slate-100"
        >
          <Search size={16} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search</span>
              <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/[0.06] text-white shadow-inner'
                  : 'text-muted hover:bg-white/[0.03] hover:text-slate-100'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/[0.06] p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-gradient text-xs font-semibold text-white">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.03] hover:text-danger"
        >
          <LogOut size={18} />
          {!collapsed && <span>Log out</span>}
        </button>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/[0.03] hover:text-slate-100 lg:flex"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
      </aside>
    </>
  );
}