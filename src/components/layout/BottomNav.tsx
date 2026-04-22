import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, ClipboardList, Bell } from 'lucide-react';
import { useObstacles } from '@/context/ObstacleContext';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { unreadAlertCount } = useObstacles();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/map', icon: Map, label: 'Map' },
    { to: '/obstacles', icon: ClipboardList, label: 'Hazards' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: unreadAlertCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-severity-high text-[9px] font-bold text-white px-1 border-2 border-card">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
