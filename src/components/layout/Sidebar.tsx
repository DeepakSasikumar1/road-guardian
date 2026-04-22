import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  Bell,
  Settings,
  Activity,
  Upload
} from 'lucide-react';
import { useObstacles } from '@/context/ObstacleContext';
import { ProfileDropdown } from './ProfileDropdown';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { unreadAlertCount } = useObstacles();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/map', icon: Map, label: 'Live Map' },
    { to: '/obstacles', icon: ClipboardList, label: 'Obstacles' },
    { to: '/upload', icon: Upload, label: 'Hazard Reporting' },
    { to: '/analytics', icon: Activity, label: 'Analytics' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
  ];

  return (
    <aside className={cn("bg-sidebar border-r border-sidebar-border flex flex-col h-full", className)}>
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white">
          <img src="/logo.png" alt="RoadWatch AI" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-bold text-foreground text-sm">RoadWatch AI</h1>
          <p className="text-xs text-muted-foreground">Smart Monitoring</p>
        </div>
      </div>

      {/* Live Status */}
      <div className="px-4 py-3 border-b border-sidebar-border space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-severity-low opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-severity-low"></span>
          </span>
          <span className="text-xs font-medium text-severity-low">System Online</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'nav-item',
              isActive && 'active'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.to === '/alerts' && unreadAlertCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-severity-high text-[10px] font-bold text-white px-1.5">
                {unreadAlertCount}
              </span>
            )}
          </NavLink>
        ))}

        <div className="pt-4 border-t border-sidebar-border mt-4">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              'nav-item',
              isActive && 'active'
            )}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <ProfileDropdown />
      </div>
    </aside>
  );
}
