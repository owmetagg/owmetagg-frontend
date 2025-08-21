'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Navbar } from '@/components/navigation/Navbar';
import { overfastHeroApi } from '@/lib/overfast-api';
import { HeroRole, SearchHistory } from '@/types';

interface HeroFilters {
  platform: 'pc' | 'console';
  gamemode: 'all' | 'quickplay' | 'competitive';
  role: 'all' | 'tank' | 'damage' | 'support';
  rank: 'all' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' | 'champion';
  timespan: 'all-time' | '30-days' | '60-days' | '90-days' | '180-days' | '365-days';
}

interface HeroStatsData {
  heroKey: string;
  heroName: string;
  role: string;
  portrait: string;
  pickRate: number;
  winRate: number;
  kda: number;
  elimsPer10: number;
  damagePer10: number;
  objKillsPer10: number;
  objTimePer10: number;
  healingPer10: number;
  gamesPlayed: number;
}

interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

const columnLabels: Record<string, string> = {
  pickRate: 'Pick Rate',
  winRate: 'Win Rate',
  kda: 'KDA',
  elimsPer10: 'Elims/10min',
  damagePer10: 'Damage/10min',
  objKillsPer10: 'Obj Kills/10min',
  objTimePer10: 'Obj Time/10min',
  healingPer10: 'Healing/10min'
};

const formatValue = (key: string, value: number) => {
  if (key === 'pickRate' || key === 'winRate') {
    return `${value.toFixed(1)}%`;
  }
  if (key === 'kda') {
    return value.toFixed(1);
  }
  if (key.includes('Per10')) {
    if (key === 'objTimePer10') {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    if (key === 'healingPer10' && value === 0) {
      return '-';
    }
    if (key === 'elimsPer10' || key === 'objKillsPer10') {
      return value.toFixed(1);
    }
    return Math.round(value).toLocaleString();
  }
  return value.toString();
};

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'tank': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'damage': return 'bg-red-100 text-red-800 border-red-200';
    case 'support': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

interface HeroStatsTableProps {
  data: HeroStatsData[];
  columns: string[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
}

const HeroStatsTable = ({ data, columns, sortConfig, onSort }: HeroStatsTableProps) => {
  const getSortIcon = (column: string) => {
    if (sortConfig.column !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-4 px-6 font-medium text-gray-900 w-64">Hero</th>
              {columns.map(col => (
                <th key={col} className="text-center py-4 px-8 font-medium text-gray-900 min-w-[120px]">
                  <button
                    onClick={() => onSort(col)}
                    className="flex items-center justify-center gap-1 w-full hover:text-gray-700 transition-colors"
                  >
                    {columnLabels[col]}
                    {getSortIcon(col)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-12 text-gray-500">
                  No heroes found matching the current filters.
                </td>
              </tr>
            ) : (
              data.map((hero, index) => (
                <motion.tr
                  key={hero.heroKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-12 h-12 overflow-hidden rounded-lg">
                        {hero.portrait ? (
                          <Image
                            src={hero.portrait}
                            alt={hero.heroName}
                            width={48}
                            height={48}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {hero.heroName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{hero.heroName}</div>
                        <Badge className={`text-xs ${getRoleColor(hero.role)}`}>
                          {hero.role.charAt(0).toUpperCase() + hero.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  {columns.map(col => (
                    <td key={col} className="text-center py-4 px-8 text-gray-900 font-medium">
                      {formatValue(col, hero[col as keyof HeroStatsData] as number)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Sample hero data (fallback for when API is unavailable)
const sampleHeroes: HeroStatsData[] = [
  { heroKey: 'tracer', heroName: 'Tracer', role: 'damage', portrait: '', pickRate: 12.5, winRate: 54.2, kda: 2.1, elimsPer10: 18.5, damagePer10: 8420, objKillsPer10: 5.2, objTimePer10: 42, healingPer10: 0, gamesPlayed: 1200 },
  { heroKey: 'reinhardt', heroName: 'Reinhardt', role: 'tank', portrait: '', pickRate: 15.8, winRate: 52.1, kda: 1.8, elimsPer10: 12.3, damagePer10: 6850, objKillsPer10: 8.1, objTimePer10: 125, healingPer10: 0, gamesPlayed: 1500 },
  { heroKey: 'mercy', heroName: 'Mercy', role: 'support', portrait: '', pickRate: 18.2, winRate: 55.7, kda: 2.9, elimsPer10: 3.2, damagePer10: 1240, objKillsPer10: 1.8, objTimePer10: 38, healingPer10: 12500, gamesPlayed: 1800 },
  { heroKey: 'widowmaker', heroName: 'Widowmaker', role: 'damage', portrait: '', pickRate: 8.4, winRate: 48.9, kda: 2.3, elimsPer10: 15.7, damagePer10: 7890, objKillsPer10: 3.1, objTimePer10: 28, healingPer10: 0, gamesPlayed: 800 },
  { heroKey: 'dva', heroName: 'D.Va', role: 'tank', portrait: '', pickRate: 11.2, winRate: 51.8, kda: 2.0, elimsPer10: 14.8, damagePer10: 5670, objKillsPer10: 7.3, objTimePer10: 98, healingPer10: 0, gamesPlayed: 1100 },
  { heroKey: 'ana', heroName: 'Ana', role: 'support', portrait: '', pickRate: 13.6, winRate: 53.4, kda: 2.7, elimsPer10: 8.9, damagePer10: 3450, objKillsPer10: 4.2, objTimePer10: 45, healingPer10: 11200, gamesPlayed: 1300 },
  { heroKey: 'genji', heroName: 'Genji', role: 'damage', portrait: '', pickRate: 9.7, winRate: 49.2, kda: 1.9, elimsPer10: 16.2, damagePer10: 7200, objKillsPer10: 4.8, objTimePer10: 35, healingPer10: 0, gamesPlayed: 950 },
  { heroKey: 'zarya', heroName: 'Zarya', role: 'tank', portrait: '', pickRate: 7.3, winRate: 54.6, kda: 2.2, elimsPer10: 13.5, damagePer10: 8100, objKillsPer10: 6.9, objTimePer10: 88, healingPer10: 0, gamesPlayed: 700 }
];

const HeroStatsPage = () => {
  const [filters, setFilters] = useState<HeroFilters>({
    platform: 'pc',
    gamemode: 'all',
    role: 'all',
    rank: 'all',
    timespan: 'all-time'
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [heroData, setHeroData] = useState<HeroStatsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'pickRate',
    direction: 'desc'
  });
  
  // Navbar state
  const [activeSection, setActiveSection] = useState('hero-stats');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('owmeta-search-history');
      if (stored) {
        const history = JSON.parse(stored) as SearchHistory[];
        setSearchHistory(history.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Navbar handlers
  const handleNavigation = (sectionId: string) => {
    if (sectionId === 'meta-stats') {
      window.location.href = '/';
    } else {
      setActiveSection(sectionId);
    }
  };

  const handlePlayerSearch = async (battleTag: string) => {
    setIsSearching(true);
    // Note: Player search functionality would be implemented here
    // For now, just simulate the search
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('owmeta-search-history');
  };

  // Sorting handler
  const handleSort = (column: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.column === column) {
        // Same column clicked - toggle direction
        const newDirection = prevConfig.direction === 'desc' ? 'asc' : 'desc';
        return { column, direction: newDirection };
      } else {
        // New column clicked - start with descending (highest to lowest)
        return { column, direction: 'desc' };
      }
    });
  };

  useEffect(() => {
    const fetchHeroStats = async () => {
      setIsLoading(true);
      try {
        const heroesResponse = filters.role !== 'all' 
          ? await overfastHeroApi.getHeroesByRole(filters.role.toUpperCase() as HeroRole)
          : await overfastHeroApi.getAllHeroes();
        
        const statsData = heroesResponse.map((hero: { id: number; name: string; role: string; imageUrl?: string }) => ({
          heroKey: hero.id.toString(),
          heroName: hero.name,
          role: hero.role.toLowerCase(),
          portrait: hero.imageUrl || '',
          pickRate: Math.random() * 15 + 2,
          winRate: Math.random() * 20 + 40,
          kda: Math.random() * 2 + 1,
          elimsPer10: Math.random() * 15 + 8,
          damagePer10: Math.random() * 8000 + 4000,
          objKillsPer10: Math.random() * 8 + 2,
          objTimePer10: Math.random() * 120 + 30,
          healingPer10: hero.role.toLowerCase() === 'support' ? Math.random() * 6000 + 3000 : 0,
          gamesPlayed: Math.floor(Math.random() * 5000) + 100
        }));

        setHeroData(statsData);
      } catch (error) {
        console.error('Failed to fetch hero stats, using sample data:', error);
        // Use sample data as fallback
        setHeroData(sampleHeroes);
      } finally {
        setIsLoading(false);
      }
    };

    // Simulate API call with delay for sample data
    const timer = setTimeout(() => {
      fetchHeroStats();
    }, 100);

    return () => clearTimeout(timer);
  }, [filters]);

  const filteredHeroData = useMemo(() => {
    let filtered = [...heroData];
    
    if (filters.role !== 'all') {
      filtered = filtered.filter(hero => hero.role.toLowerCase() === filters.role.toLowerCase());
    }
    
    // Apply sorting
    if (sortConfig.column && sortConfig.direction) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.column as keyof HeroStatsData] as number;
        const bValue = b[sortConfig.column as keyof HeroStatsData] as number;
        
        if (sortConfig.direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }
    
    return filtered;
  }, [heroData, filters, sortConfig]);

  const handleFilterChange = (key: keyof HeroFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'gamemode' && value !== 'competitive' && { rank: 'all' })
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Seamless Navbar */}
      <Navbar
        onNavigate={handleNavigation}
        onSearch={handlePlayerSearch}
        activeSection={activeSection}
        isSearching={isSearching}
        searchHistory={searchHistory}
        onClearHistory={clearSearchHistory}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hero Statistics</h1>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-row flex-wrap gap-2">
              {/* Platform Filter */}
              <div className="flex flex-col flex-nowrap justify-start items-start">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Platform</label>
                <ToggleGroup 
                  type="single" 
                  value={filters.platform} 
                  onValueChange={(value) => value && handleFilterChange('platform', value)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="pc" className="px-4">
                    PC
                  </ToggleGroupItem>
                  <ToggleGroupItem value="console" className="px-4">
                    Console
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Game Mode Filter */}
              <div className="flex flex-col flex-nowrap justify-start items-start min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Game Mode</label>
                <ToggleGroup 
                  type="single" 
                  value={filters.gamemode} 
                  onValueChange={(value) => value && handleFilterChange('gamemode', value)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="all" className="px-3">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="quickplay" className="px-3">
                    Quickplay
                  </ToggleGroupItem>
                  <ToggleGroupItem value="competitive" className="px-3">
                    Competitive
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Role, Rank, and Time Span grouped together with tighter spacing */}
              <div className="flex flex-row flex-wrap gap-1">
                {/* Role Filter */}
                <div className="flex flex-col flex-nowrap justify-start items-start min-w-[120px]">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Role</label>
                  <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="tank">Tank</SelectItem>
                      <SelectItem value="damage">Damage</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rank Filter - Always show but disable when not competitive */}
                <div className="flex flex-col flex-nowrap justify-start items-start min-w-[130px]">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Rank</label>
                  <Select 
                    value={filters.rank} 
                    onValueChange={(value) => handleFilterChange('rank', value)}
                    disabled={filters.gamemode !== 'competitive'}
                  >
                    <SelectTrigger className={filters.gamemode !== 'competitive' ? 'opacity-50' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="grandmaster">Grandmaster</SelectItem>
                      <SelectItem value="champion">Champion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Span Filter */}
                <div className="flex flex-col flex-nowrap justify-start items-start min-w-[140px]">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Time Span</label>
                  <Select value={filters.timespan} onValueChange={(value) => handleFilterChange('timespan', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-time">All Time</SelectItem>
                      <SelectItem value="30-days">Past 30 Days</SelectItem>
                      <SelectItem value="60-days">Past 60 Days</SelectItem>
                      <SelectItem value="90-days">Past 90 Days</SelectItem>
                      <SelectItem value="180-days">Past 180 Days</SelectItem>
                      <SelectItem value="365-days">Past 365 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Empty block to balance the right side */}
              <div className="flex-1 min-w-[150px]"></div>
            </div>
          </CardContent>
        </Card>

        {/* Data View Tabs and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hero Performance Data</CardTitle>
              <ToggleGroup 
                type="single" 
                value={activeTab} 
                onValueChange={(value) => value && setActiveTab(value)}
                className="bg-gray-100 p-1 rounded-lg"
              >
                <ToggleGroupItem 
                  value="overview" 
                  className="px-6 py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm"
                >
                  Overview
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="advanced" 
                  className="px-6 py-2 data-[state=on]:bg-white data-[state=on]:shadow-sm"
                >
                  Advanced
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading hero statistics...</span>
              </div>
            ) : (
              <div>
                {activeTab === 'overview' && (
                  <HeroStatsTable 
                    data={filteredHeroData}
                    columns={['pickRate', 'winRate', 'kda']}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                )}

                {activeTab === 'advanced' && (
                  <HeroStatsTable 
                    data={filteredHeroData}
                    columns={['elimsPer10', 'damagePer10', 'objKillsPer10', 'objTimePer10', 'healingPer10']}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeroStatsPage;