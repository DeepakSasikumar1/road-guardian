import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="hidden md:block fixed left-0 top-0 h-screen w-64 z-40">
        <Sidebar className="w-full h-full" />
      </div>
      <main className="flex-1 min-h-screen md:ml-64 w-full">
        <Outlet />
      </main>
    </div>
  );
}
