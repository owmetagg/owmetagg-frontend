'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HeroPickRate, ROLE_COLORS } from '@/types';
import { TrendingUp, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface PickRateChartProps {
  data: HeroPickRate[];
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

// Hero data interface from OverFast API
interface HeroData {
  key: string;
  name: string;
  portrait: string;
  role: string;
}

// Get role color for badges
const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'tank': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'damage': return 'bg-red-100 text-red-800 border-red-200';
    case 'support': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};


export function PickRateChart({ 
  data, 
  loading = false, 
  error, 
  limit = 5,
  onHeroClick 
}: PickRateChartProps) {
  const [heroPortraits, setHeroPortraits] = useState<Record<string, string>>({});
  const [heroesLoading, setHeroesLoading] = useState(true);

  // Fetch hero portraits from OverFast API
  useEffect(() => {
    const fetchHeroPortraits = async () => {
      try {
        const response = await fetch('https://overfast-api.tekrop.fr/heroes');
        const heroes: HeroData[] = await response.json();
        
        const portraitMap: Record<string, string> = {};
        heroes.forEach(hero => {
          portraitMap[hero.name.toLowerCase()] = hero.portrait;
          portraitMap[hero.key] = hero.portrait;
        });
        
        setHeroPortraits(portraitMap);
      } catch (error) {
        console.error('Failed to fetch hero portraits:', error);
      } finally {
        setHeroesLoading(false);
      }
    };

    fetchHeroPortraits();
  }, []);

  const getHeroPortraitUrl = (heroName: string): string => {
    const lowerName = heroName.toLowerCase();
    const keyName = lowerName.replace(/[:\s]/g, '-').replace(/\./g, '').replace(/ú/g, 'u').replace(/ö/g, 'o');
    
    return heroPortraits[lowerName] || heroPortraits[keyName] || DEFAULT_HERO_IMAGE;
  };

  const chartData = useMemo(() => {
    if (!data?.length) return [];
    
    return data
      .sort((a, b) => b.pickRate - a.pickRate)
      .slice(0, limit)
      .map((hero) => ({
        ...hero,
        portrait: getHeroPortraitUrl(hero.heroName),
      }));
  }, [data, limit, heroPortraits]);

  if (loading || heroesLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span>Top Pick Rate Heroes</span>
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
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span>Top Pick Rate Heroes</span>
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
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span>Top Pick Rate Heroes</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">No pick rate data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span>Top Pick Rate Heroes</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
        
      </CardHeader>
      
      <CardContent className="pt-0">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {chartData.map((hero, index) => (
            <motion.div
              key={hero.heroId}
              variants={itemVariants}
              className="group relative rounded-lg transition-all duration-200 hover:bg-accent/50 cursor-pointer"
              onClick={() => onHeroClick?.(hero.heroName.toLowerCase().replace(/[:\s]/g, '-'))}
            >
              <div className="flex items-center justify-between p-3">
                {/* Hero info with inline stats */}
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative w-12 h-12 overflow-hidden rounded-lg flex-shrink-0">
                    {hero.portrait ? (
                      <Image
                        src={hero.portrait}
                        alt={hero.heroName}
                        width={48}
                        height={48}
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_HERO_IMAGE;
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        {hero.heroName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors leading-tight mb-1">
                          {hero.heroName}
                        </div>
                        <Badge className={`text-xs ${getRoleColor(hero.role)} w-fit`}>
                          {hero.role.charAt(0).toUpperCase() + hero.role.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 ml-4">
                        {/* Pick Rate */}
                        <div className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="mb-1 font-medium text-gray-900 text-sm">
                              {hero.pickRate.toFixed(1)}%
                            </span>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-yellow-500 opacity-60 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(hero.pickRate / 20) * 100}%` }}
                                transition={{ 
                                  duration: 0.8, 
                                  delay: index * 0.05,
                                  ease: "easeOut"
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        {/* Rank indicator */}
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Tank</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Damage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Support</span>
            </div>
          </div>
          <span className="text-xs">Click hero for details</span>
        </div>
      </CardContent>
    </Card>
  );
}