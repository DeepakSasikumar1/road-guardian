import { useMemo } from 'react';
import { Obstacle } from '@/types/obstacle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, PieChartIcon, BarChart3, Activity } from 'lucide-react';

const SEVERITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const STATUS_COLORS = {
  reported: '#3b82f6',
  in_progress: '#f59e0b',
  resolved: '#22c55e',
};

export function AnalyticsCharts({ data: obstacles }: { data: Obstacle[] }) {
  const stats = useMemo(() => {
    return {
      highSeverity: obstacles.filter(o => o.severity === 'high').length,
      mediumSeverity: obstacles.filter(o => o.severity === 'medium').length,
      lowSeverity: obstacles.filter(o => o.severity === 'low').length,
    };
  }, [obstacles]);

  const severityData = useMemo(() => [
    { name: 'High', value: stats.highSeverity, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: stats.mediumSeverity, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: stats.lowSeverity, color: SEVERITY_COLORS.low },
  ], [stats]);

  const typeLabels: Record<string, string> = {
    pothole: 'Pothole',
    crack: 'Road Crack',
    water_hazard: 'Water Drain',
    debris: 'Debris',
  };

  const typeData = useMemo(() => {
    const typeCounts = obstacles.reduce((acc, o) => {
      const label = typeLabels[o.type] ?? o.type;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [obstacles]);

  const statusData = useMemo(() => {
    const statusCounts = obstacles.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Reported', value: statusCounts.reported || 0, color: STATUS_COLORS.reported },
      { name: 'In Progress', value: statusCounts.in_progress || 0, color: STATUS_COLORS.in_progress },
      { name: 'Resolved', value: statusCounts.resolved || 0, color: STATUS_COLORS.resolved },
    ];
  }, [obstacles]);

  const hourlyTrendData = useMemo(() => {
    const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      detected: 0,
      resolved: 0,
    }));

    obstacles.forEach(o => {
      if (o.detectedAt) {
        const d = new Date(o.detectedAt);
        hourlyCounts[d.getHours()].detected += 1;
      }
      if (o.resolvedAt) {
        const d = new Date(o.resolvedAt);
        hourlyCounts[d.getHours()].resolved += 1;
      }
    });

    return hourlyCounts;
  }, [obstacles]);

  const areaData = useMemo(() => {
    const areaCounts = obstacles.reduce((acc, o) => {
      acc[o.location.area] = (acc[o.location.area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(areaCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [obstacles]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Severity Distribution Pie Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-primary" />
            Severity Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {severityData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolution Status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Resolution Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Obstacle Types Bar Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Obstacle Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Trend Area Chart */}
      <Card className="bg-card border-border md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Detection Trend (Time of Day)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrendData}>
                <defs>
                  <linearGradient id="colorDetected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  interval={2}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="detected"
                  name="Detected"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorDetected)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Detected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Resolved</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Areas by Obstacle Count */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Top Areas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" name="Obstacles" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
