'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendData, ROLE_COLORS } from '@/types';
import { format } from 'date-fns';

interface TrendsChartProps {
  data: TrendData[];
  loading?: boolean;
  error?: string;
  limit?: number;
}

interface ChartDataPoint {
  date: string;
  [heroName: string]: string | number;
}

export function TrendsChart({ data, loading = false, error, limit = 6 }: TrendsChartProps) {
  const { chartData, trendSummary } = useMemo(() => {
    if (!data?.length) return { chartData: [], trendSummary: [] };

    // Take top trending heroes (by absolute change)
    const topHeroes = data
      .sort((a, b) => Math.abs(b.pickRateChange) - Math.abs(a.pickRateChange))
      .slice(0, limit);

    // Get all unique dates from all heroes
    const allDates = new Set<string>();
    topHeroes.forEach(hero => {
      hero.dataPoints.forEach(point => allDates.add(point.date));
    });

    // Create chart data with all heroes for each date
    const chartData: ChartDataPoint[] = Array.from(allDates)
      .sort()
      .map(date => {
        const dataPoint: ChartDataPoint = { date };
        topHeroes.forEach(hero => {
          const point = hero.dataPoints.find(p => p.date === date);
          if (point) {
            dataPoint[hero.heroName] = Number(point.pickRate.toFixed(1));
          }
        });
        return dataPoint;
      });

    const trendSummary = topHeroes.map(hero => ({
      heroName: hero.heroName,
      role: hero.role,
      change: hero.pickRateChange,
      trend: hero.trend,
      color: ROLE_COLORS[hero.role],
    }));

    return { chartData, trendSummary };
  }, [data, limit]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM dd');
    } catch {
      return dateStr;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover p-3 rounded-lg shadow-lg border">
          <p className="font-semibold text-foreground">{formatDate(label || '')}</p>
          <div className="space-y-1">
            {payload.map((entry, index: number) => (
              <p key={index} className="text-sm">
                <span className="font-medium" style={{ color: entry.color }}>
                  {entry.dataKey}:
                </span>
                <span className="ml-1">{entry.value}%</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            Pick Rate Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            Pick Rate Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <p className="text-muted-foreground">{error}</p>
            <button 
              className="mt-2 text-primary hover:underline text-sm"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length || !trendSummary.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            Pick Rate Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No trend data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 bg-accent rounded-full"></div>
          Pick Rate Trends
          <span className="text-sm text-muted-foreground font-normal ml-2">
            (Last 30 days)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              className="text-xs"
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            {trendSummary.map((hero) => (
              <Line
                key={hero.heroName}
                type="monotone"
                dataKey={hero.heroName}
                stroke={hero.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Trend Summary */}
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Trending Heroes</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {trendSummary.map((hero) => (
              <div key={hero.heroName} className="flex items-center gap-2">
                {getTrendIcon(hero.trend)}
                <span className="font-medium" style={{ color: hero.color }}>
                  {hero.heroName}
                </span>
                <span className={`ml-auto font-mono ${
                  hero.change > 0 ? 'text-green-500' : hero.change < 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {hero.change > 0 ? '+' : ''}{hero.change.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}