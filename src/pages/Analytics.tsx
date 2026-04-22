import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useObstacles } from '@/context/ObstacleContext';
import { useDownloadReport } from '@/hooks/useDownloadReport';
import { TrendingUp, TrendingDown, AlertTriangle, Users, Download, Loader2, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Analytics() {
  const { obstacles, isLoading, obstaclesError } = useObstacles();
  const { downloadPDF, isGenerating } = useDownloadReport();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('month');

  const filteredObstacles = useMemo(() => {
    const now = new Date();
    let cutoffDate = new Date(0); // all time

    if (timeRange === 'today') {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === 'week') {
      cutoffDate = new Date(now);
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      cutoffDate = new Date(now);
      cutoffDate.setMonth(now.getMonth() - 1);
    }

    return obstacles.filter(o => new Date(o.detectedAt) >= cutoffDate);
  }, [obstacles, timeRange]);

  const activeTeams = useMemo(() => {
    return new Set(filteredObstacles.filter(o => o.assignedTo).map(o => o.assignedTo)).size;
  }, [filteredObstacles]);

  const avgResponseTime = useMemo(() => {
    const validResolutionTimes = filteredObstacles
      .filter(o => o.detectedAt && o.resolvedAt)
      .map(o => new Date(o.resolvedAt!).getTime() - new Date(o.detectedAt).getTime());

    const avgMs = validResolutionTimes.length > 0
      ? validResolutionTimes.reduce((a, b) => a + b, 0) / validResolutionTimes.length
      : 0;

    return avgMs > 0 ? `${(avgMs / (1000 * 60 * 60)).toFixed(1)} hrs` : '0 hrs';
  }, [filteredObstacles]);

  const resolutionRate = useMemo(() => {
    const total = filteredObstacles.length;
    const resolved = filteredObstacles.filter(o => o.status === 'resolved').length;
    return total > 0 ? Math.round((resolved / total) * 100) : 0;
  }, [filteredObstacles]);

  const highSeverityRatio = useMemo(() => {
    const total = filteredObstacles.length;
    const high = filteredObstacles.filter(o => o.severity === 'high').length;
    return total > 0 ? Math.round((high / total) * 100) : 0;
  }, [filteredObstacles]);

  const handleDownloadReport = async () => {
    const result = await downloadPDF('analytics-charts');
    if (result.success) {
      toast({
        title: "Report Downloaded",
        description: `${result.fileName} has been saved.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not generate the report. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Analytics"
        subtitle="Statistical breakdown of road obstacles and resolution efficiency"
      />

      <div className="p-6 space-y-6">
        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Loading analytics data…</span>
          </div>
        )}
        {obstaclesError && !isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>{obstaclesError} — Charts may be incomplete.</span>
          </div>
        )}

        {/* Header with Download & Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Performance Overview</h2>
            <p className="text-sm text-muted-foreground">Key metrics based on selected time range</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Past 7 Days</SelectItem>
                <SelectItem value="month">Past 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleDownloadReport}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  <p className="text-3xl font-bold text-foreground">{resolutionRate}%</p>
                </div>
                <div className="p-3 bg-severity-low/10 rounded-full">
                  <TrendingUp className="w-6 h-6 text-severity-low" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-3xl font-bold text-foreground">{avgResponseTime}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingDown className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Severity Ratio</p>
                  <p className="text-3xl font-bold text-foreground">{highSeverityRatio}%</p>
                </div>
                <div className="p-3 bg-severity-high/10 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-severity-high" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Teams</p>
                  <p className="text-3xl font-bold text-foreground">{activeTeams}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div id="analytics-charts">
          <AnalyticsCharts data={filteredObstacles} />
        </div>
      </div>
    </div>
  );
}
