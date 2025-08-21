'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HeroWinRate, ROLE_COLORS } from '@/types';
import { Trophy, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

interface WinRateChartProps {
  data: HeroWinRate[];
  loading?: boolean;
  error?: string;
  limit?: number;
  onHeroClick?: (heroKey: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};

// Fallback hero portrait
const DEFAULT_HERO_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMUYyOTM3Ii8+CjxjaXJjbGUgY3g9IjMyIiBjeT0iMjgiIHI9IjEyIiBmaWxsPSIjNDc1NTY5Ii8+CjxwYXRoIGQ9Ik0xNiA1MkMxNiA0My4xNjM0IDIzLjE2MzQgMzYgMzIgMzZDNDAuODM2NiAzNiA0OCA0My4xNjM0IDQ4IDUyVjY0SDE2VjUyWiIgZmlsbD0iIzQ3NTU2OSIvPgo8L3N2Zz4=';

// Generate hero portrait URL
const getHeroPortrait = (heroName: string): string => {
  // Convert hero name to URL-friendly format
  const formattedName = heroName.toLowerCase()
    .replace(/[:\s]/g, '-')
    .replace(/\./g, '')
    .replace(/ú/g, 'u')
    .replace(/ö/g, 'o');
  
  // Use OverFast API CDN for hero portraits
  return `https://overfast-api.tekrop.fr/heroes/${formattedName}/portrait`;
};

// Get performance color and label
const getPerformance = (winRate: number) => {
  if (winRate >= 55) return { label: 'Excellent', color: 'text-green-500', icon: TrendingUp };
  if (winRate >= 52) return { label: 'Good', color: 'text-blue-500', icon: TrendingUp };
  if (winRate >= 48) return { label: 'Average', color: 'text-yellow-500', icon: null };
  return { label: 'Poor', color: 'text-red-500', icon: TrendingDown };
};

export function WinRateChart({ 
  data, 
  loading = false, 
  error, 
  limit = 5,
  onHeroClick 
}: WinRateChartProps) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    
    return data
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit)
      .map((hero) => ({
        ...hero,
        portrait: getHeroPortrait(hero.heroName),
        performance: getPerformance(hero.winRate),
      }));
  }, [data, limit]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <span>Top Win Rate Heroes</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <span>Top Win Rate Heroes</span>
            </div>
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

  if (!chartData.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <span>Top Win Rate Heroes</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No win rate data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-500" />
            <span>Top Win Rate Heroes</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
        
        {/* Table header */}
        <div className="grid grid-cols-[1fr,100px,100px] gap-4 mt-4 pb-2 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div>Hero</div>
          <div className="text-center">Win Rate</div>
          <div className="text-center">Performance</div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {chartData.map((hero, index) => {
            const PerformanceIcon = hero.performance.icon;
            
            return (
              <motion.div
                key={hero.heroId}
                variants={itemVariants}
                className="group relative rounded-lg transition-all duration-200 hover:bg-accent/50 cursor-pointer"
                onClick={() => onHeroClick?.(hero.heroName.toLowerCase().replace(/[:\s]/g, '-'))}
              >
                <div className="grid grid-cols-[1fr,100px,100px] gap-4 items-center p-3">
                  {/* Hero info */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div 
                        className="absolute inset-0 rounded-md opacity-20"
                        style={{ backgroundColor: ROLE_COLORS[hero.role] }}
                      />
                      <img
                        src={hero.portrait}
                        alt={hero.heroName}
                        className="relative h-12 w-12 rounded-md object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_HERO_IMAGE;
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {hero.heroName}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {hero.role.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="text-center">
                    <div className="space-y-1">
                      <p className={`font-mono text-sm font-medium ${
                        hero.winRate >= 52 ? 'text-green-500' : 
                        hero.winRate >= 48 ? 'text-yellow-500' : 
                        'text-red-500'
                      }`}>
                        {hero.winRate.toFixed(2)}%
                      </p>
                      <ProgressBar
                        value={hero.winRate - 40} // Adjust for 40-60% range display
                        color="green"
                        maxValue={20} // 60-40 = 20% range
                        showValue={false}
                        animated={true}
                        delay={index * 0.1}
                        className="!gap-0"
                      />
                    </div>
                  </div>

                  {/* Performance indicator */}
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1 ${hero.performance.color}`}>
                      {PerformanceIcon && <PerformanceIcon className="h-4 w-4" />}
                      <span className="text-xs font-medium">
                        {hero.performance.label}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>55%+ Excellent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>52-54% Good</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>48-51% Average</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>&lt;48% Poor</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}