'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Search, Users, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { playerRankStorage, RankTierData, SeasonStats } from '@/lib/playerRankStorage';
import { RankDistribution, Rank } from '@/types';

interface RankDistributionChartProps {
  loading?: boolean;
  error?: string;
  triggerUpdate?: number; // Used to trigger refresh when new players are searched
  mockData?: RankDistribution[]; // Mock rank distribution data
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

// Custom tooltip for rank information
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RankTierData;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as RankTierData;
    return (
      <div className="bg-popover p-3 rounded-lg shadow-lg border">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={playerRankStorage.getRankIcon(data.apiRank)}
            alt={data.rank}
            className="w-6 h-6"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <p className="font-semibold text-foreground">{data.tierDisplay}</p>
        </div>
        <p className="text-sm font-medium text-primary">
          {data.count} player{data.count !== 1 ? 's' : ''} ({data.percentage.toFixed(1)}%)
        </p>
        <div className="text-xs text-muted-foreground mt-1">
          {data.count === 1 ? 'Role: ' : 'Roles: '}Various
        </div>
      </div>
    );
  }
  return null;
};

// Custom X-axis tick with rank icons
interface TickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string;
  };
}

const CustomXAxisTick = ({ x, y, payload }: TickProps) => {
  if (!payload?.value) return null;

  // Parse the tier display (e.g., "Diamond 3")
  const parts = payload.value.split(' ');
  if (parts.length !== 2) return null;

  const rank = parts[0].toLowerCase();
  const tier = parts[1];

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Rank icon */}
      <image
        x={-16}
        y={0}
        width="32"
        height="32"
        href={playerRankStorage.getRankIcon(rank)}
        onError={() => {
          // Fallback to text if icon fails to load
        }}
      />
      {/* Tier number */}
      <text
        x={0}
        y={45}
        textAnchor="middle"
        className="fill-muted-foreground text-xs font-medium"
      >
        {tier}
      </text>
    </g>
  );
};

// Convert mock RankDistribution data to RankTierData format
const convertMockDataToChartData = (mockData: RankDistribution[]): RankTierData[] => {
  const rankColors: Record<string, string> = {
    'bronze': '#CD7F32',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'platinum': '#E5E4E2',
    'diamond': '#B9F2FF',
    'master': '#FF8C00',
    'grandmaster': '#FF6B6B',
    'top 500': '#FF00FF'
  };

  return mockData.map((item, index) => {
    const rankName = item.rank.toLowerCase().replace('_', ' ');
    const displayName = rankName.charAt(0).toUpperCase() + rankName.slice(1);
    
    return {
      rank: displayName,
      apiRank: rankName,
      tier: 3, // Default tier for mock data
      count: item.playerCount,
      percentage: item.percentage,
      fill: rankColors[rankName] || '#666666',
      tierDisplay: `${displayName} 3`
    };
  });
};

export function RankDistributionChart({ 
  loading = false, 
  error, 
  triggerUpdate,
  mockData 
}: RankDistributionChartProps) {
  const [selectedSeason, setSelectedSeason] = useState<number>(playerRankStorage.getCurrentSeason());
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);

  // Update available seasons when data changes
  useEffect(() => {
    const allSeasons = playerRankStorage.getAllSeasons();
    setAvailableSeasons(allSeasons);
  }, [triggerUpdate]);

  // Generate chart data and stats for selected season
  const { chartData, hasDataForSeason, usingMockData } = useMemo(() => {
    const playerData = playerRankStorage.generateDistributionData(selectedSeason);
    const stats = playerRankStorage.getSeasonStats(selectedSeason);
    setSeasonStats(stats);
    
    // If no player data is available and we have mock data, use it
    if (playerData.length === 0 && mockData && mockData.length > 0) {
      const mockChartData = convertMockDataToChartData(mockData);
      const mockStats: SeasonStats = {
        totalEntries: mockData.reduce((sum, item) => sum + item.playerCount, 0),
        uniquePlayers: mockData.reduce((sum, item) => sum + item.playerCount, 0),
        rolesTracked: ['tank', 'damage', 'support'],
        dateRange: null
      };
      setSeasonStats(mockStats);
      
      return {
        chartData: mockChartData,
        hasDataForSeason: true,
        usingMockData: true
      };
    }
    
    return {
      chartData: playerData,
      hasDataForSeason: playerData.length > 0,
      usingMockData: false
    };
  }, [selectedSeason, triggerUpdate, mockData]); // triggerUpdate is needed to refresh when new data is added

  const handleSeasonChange = (value: string) => {
    setSelectedSeason(parseInt(value));
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Competitive Rank Distribution</span>
            </div>
            <Skeleton className="h-8 w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
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
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Competitive Rank Distribution</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
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

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Competitive Rank Distribution</span>
            </CardTitle>
            <CardDescription>
              {usingMockData 
                ? `Season ${selectedSeason} competitive rank distribution (Global data)`
                : `Season ${selectedSeason} rank distribution from searched players`
              }
              {selectedSeason === playerRankStorage.getCurrentSeason() && ' (Current)'}
            </CardDescription>
          </div>
          
          {/* Season Selector */}
          <Select 
            value={selectedSeason.toString()} 
            onValueChange={handleSeasonChange}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableSeasons.map(season => {
                const seasonPlayers = playerRankStorage.getPlayersBySeason(season);
                const hasData = seasonPlayers.length > 0;
                const uniquePlayerCount = new Set(seasonPlayers.map(p => p.playerId)).size;
                
                return (
                  <SelectItem 
                    key={season} 
                    value={season.toString()}
                    className={`text-xs ${!hasData ? 'text-muted-foreground' : ''}`}
                  >
                    S{season}
                    {season === playerRankStorage.getCurrentSeason() && ' (Current)'}
                    {hasData && (
                      <span className="ml-1 text-muted-foreground">
                        ({uniquePlayerCount})
                      </span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {!hasDataForSeason ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-[350px] text-center"
          >
            <Search className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Season {selectedSeason} Data</h3>
            <p className="text-muted-foreground max-w-md text-sm">
              Search for players to build rank distribution data for Season {selectedSeason}.
              Each player search adds their competitive ranks to the distribution.
            </p>
            
            {/* Overall stats if no data for this season */}
            {playerRankStorage.getSeasonsWithData().length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-muted/20 text-xs text-muted-foreground">
                <p className="mb-1">
                  <Users className="h-3 w-3 inline mr-1" />
                  {playerRankStorage.getOverallStats().totalPlayers} players tracked across{' '}
                  {playerRankStorage.getSeasonsWithData().length} season{playerRankStorage.getSeasonsWithData().length !== 1 ? 's' : ''}
                </p>
                <p>Try switching to Season {playerRankStorage.getSeasonsWithData()[0]} to view data</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Season Statistics */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {seasonStats?.uniquePlayers} unique player{seasonStats?.uniquePlayers !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {seasonStats?.totalEntries} rank entries
                  </span>
                </div>
                <span>Season {selectedSeason}</span>
              </div>
            </motion.div>
            
            {/* Chart */}
            <motion.div variants={itemVariants} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="tierDisplay"
                    tick={<CustomXAxisTick />}
                    interval={0}
                    height={60}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}%`}
                    className="text-xs"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="percentage" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Distribution Summary */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {chartData.reduce((sum, tier) => sum + tier.count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Ranks</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">
                  {seasonStats?.uniquePlayers || 0}
                </p>
                <p className="text-xs text-muted-foreground">Players</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {chartData.filter(t => ['diamond', 'master', 'grandmaster', 'champion', 'ultimate'].includes(t.apiRank))
                    .reduce((sum, t) => sum + t.percentage, 0).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">High Skill</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">
                  {Math.max(...chartData.map(t => t.percentage)).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Most Common</p>
              </div>
            </motion.div>

            {/* Roles Summary */}
            {seasonStats?.rolesTracked && seasonStats.rolesTracked.length > 0 && (
              <motion.div variants={itemVariants}>
                <div className="text-center text-xs text-muted-foreground">
                  Roles tracked: {seasonStats.rolesTracked.map(role => 
                    role.charAt(0).toUpperCase() + role.slice(1)
                  ).join(', ')}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}