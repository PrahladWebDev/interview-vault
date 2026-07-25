import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import CommandPalette from '../components/CommandPalette.jsx';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          <Outlet />
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
