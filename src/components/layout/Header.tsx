import { Search, RefreshCw, AlertTriangle, AlertCircle, Info, MapPin } from 'lucide-react';
import { useObstacles } from '@/context/ObstacleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationBell } from './NotificationBell';
import { ModeToggle } from '@/components/mode-toggle';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { stats, obstacles, setSelectedObstacle } = useObstacles();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleRefresh = () => {
    setLastUpdate(new Date());
  };

  // Close search results on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredObstacles = searchQuery.trim() === '' ? [] : obstacles.filter(o => 
    o.obstacleId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.location.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.location.address.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6);

  const handleSelectResult = (obstacle: any) => {
    setSelectedObstacle(obstacle);
    setShowResults(false);
    setSearchQuery('');
    navigate('/dashboard'); 
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-severity-high" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-severity-medium" />;
      case 'low': return <Info className="w-4 h-4 text-severity-low" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search ID, area, or type..."
            className="w-64 pl-9 bg-secondary/50 border-border/50 transition-all focus:w-80"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setShowResults(true);
            }}
          />
          
          {/* Dynamic Search Dropdown */}
          <AnimatePresence>
            {showResults && searchQuery.trim() !== '' && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[320px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-[100]"
              >
                {filteredObstacles.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                      Top Matches
                    </div>
                    {filteredObstacles.map((obs) => (
                      <div 
                        key={obs.id}
                        className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-0 transition-colors flex items-start gap-3 group"
                        onClick={() => handleSelectResult(obs)}
                      >
                        <div className="mt-0.5 p-1.5 rounded-md bg-secondary group-hover:bg-background transition-colors">
                          {getSeverityIcon(obs.severity)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {obs.type.replace('_', ' ').toUpperCase()}
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                              {obs.obstacleId || "UNKNOWN-ID"}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {obs.location.area} • {obs.location.address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-medium">No hazards found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try searching a street name, alert ID (like RODS-H2...), or type.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Last Update */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          <span>Updated at {lastUpdate.toLocaleTimeString()}</span>
        </div>

        {/* Refresh Button */}
        <Button variant="glass" size="icon-sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Theme Toggle */}
        <ModeToggle />

        {/* Live Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-severity-high/10 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-severity-high opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-severity-high"></span>
          </span>
          <span className="text-xs font-semibold text-severity-high">{stats.highSeverity} Critical</span>
        </div>
      </div>
    </header>
  );
}
