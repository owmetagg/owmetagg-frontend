'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, Gamepad2 } from 'lucide-react';

// Components
import { Navbar } from '@/components/navigation/Navbar';
import { SeasonFilter } from '@/components/header/SeasonFilter';
import { PickRateChart } from '@/components/charts/PickRateChart';
import { WinRateChart } from '@/components/charts/WinRateChart';
import { TrendsChart } from '@/components/charts/TrendsChart';
import { RankDistributionChart } from '@/components/charts/RankDistributionChart';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// API and Types
import { 
  overfastHeroApi, 
  overfastPlayerApi, 
  mockStatsApi, 
  overfastApiUtils 
} from '@/lib/overfast-api';
import { playerRankStorage } from '@/lib/playerRankStorage';
import { PlayerProfile, DashboardFilters, OVERWATCH_COLORS, SearchHistory } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
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

export default function Dashboard() {
  // State management
  const [filters, setFilters] = useState<DashboardFilters>({
    season: 14, // Default to current season (Season 14)
  });
  const [activeSection, setActiveSection] = useState('meta-stats');
  const [searchedPlayer, setSearchedPlayer] = useState<PlayerProfile | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [rankDataUpdated, setRankDataUpdated] = useState(0);

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

  // API Health Check (test with heroes endpoint)
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        await overfastHeroApi.getAllHeroes();
        setApiHealthy(true);
      } catch (error) {
        console.warn('OverFast API may be slow or unavailable, using mock data:', error);
        setApiHealthy(false);
      }
    };

    checkApiHealth();
  }, []);

  // Data fetching with React Query using OverFast API
  const {
    data: pickRatesData,
    isLoading: pickRatesLoading,
    error: pickRatesError,
  } = useQuery({
    queryKey: ['pickRates', filters.season, filters.rank, filters.role],
    queryFn: () => mockStatsApi.getHeroPickRates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: winRatesData,
    isLoading: winRatesLoading,
    error: winRatesError,
  } = useQuery({
    queryKey: ['winRates', filters.season, filters.rank, filters.role],
    queryFn: () => mockStatsApi.getHeroWinRates(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: trendsData,
    isLoading: trendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['trends', filters.season, filters.rank, filters.role],
    queryFn: () => mockStatsApi.getPickRateTrends(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    isLoading: rankDistributionLoading,
    error: rankDistributionError,
  } = useQuery({
    queryKey: ['rankDistribution', filters.season],
    queryFn: () => mockStatsApi.getRankDistribution(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Event handlers
  const handleSeasonChange = (season: number) => {
    setFilters(prev => ({ ...prev, season }));
  };

  const handleNavigation = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handlePlayerSearch = async (battleTag: string) => {
    if (!overfastApiUtils.validateBattleNetId(battleTag)) {
      setSearchError('Invalid BattleNet ID format');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const player = await overfastPlayerApi.getPlayerProfile(battleTag);
      setSearchedPlayer(player);
      saveSearchHistory(battleTag, true);
      
      // Store player rank data for the current season
      try {
        // Get the raw player summary for rank storage
        const playerSummary = await overfastPlayerApi.getPlayerSummary(battleTag);
        playerRankStorage.addPlayer(playerSummary, filters.season);
        
        // Trigger rank distribution chart update
        setRankDataUpdated(prev => prev + 1);
      } catch (rankError) {
        console.warn('Failed to store player rank data:', rankError);
        // Don't show error to user as this is background functionality
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to find player';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      setSearchError(errorMessage);
      saveSearchHistory(battleTag, false);
    } finally {
      setIsSearching(false);
    }
  };

  const saveSearchHistory = (battlenetId: string, found: boolean) => {
    try {
      const newEntry: SearchHistory = {
        battlenetId,
        searchedAt: new Date().toISOString(),
        found,
      };

      const updatedHistory = [
        newEntry,
        ...searchHistory.filter(h => h.battlenetId !== battlenetId),
      ].slice(0, 5);

      setSearchHistory(updatedHistory);
      localStorage.setItem('owmeta-search-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('owmeta-search-history');
  };

  const handleHeroClick = (heroKey: string) => {
    // For now, just log the hero click - in future this will navigate to hero detail page
    console.log(`Navigating to hero: ${heroKey}`);
    // Future implementation: router.push(`/heroes/${heroKey}`);
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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8 space-y-8"
      >
        {/* Season Filter and API Status */}
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {activeSection === 'meta-stats' ? 'Meta Statistics' :
                 activeSection === 'hero-stats' ? 'Hero Statistics' :
                 activeSection === 'role-stats' ? 'Role Statistics' :
                 'Leaderboard'}
              </h2>
              <p className="text-muted-foreground">
                Real-time Overwatch competitive analytics and insights
              </p>
            </div>

            <SeasonFilter
              selectedSeason={filters.season}
              onSeasonChange={handleSeasonChange}
            />
          </div>

          {/* API Status Alert */}
          {apiHealthy === false && (
            <Alert className="border-yellow-500/50 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                OverFast API is slow or unavailable. Using cached data and mock statistics.
                <br />
                <span className="text-xs text-muted-foreground">
                  Player search functionality may be limited.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Search Error Alert */}
          {searchError && (
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {searchError}
              </AlertDescription>
            </Alert>
          )}

          {/* Player Search Result */}
          {searchedPlayer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${OVERWATCH_COLORS.secondary}20` }}
                    >
                      <Gamepad2 
                        className="h-6 w-6" 
                        style={{ color: OVERWATCH_COLORS.secondary }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{searchedPlayer.displayName}</h3>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>Rank: <span className="font-medium">{searchedPlayer.rank}</span></span>
                        <span>SR: <span className="font-medium">{searchedPlayer.skillRating}</span></span>
                        <span>Endorsement: <span className="font-medium">{searchedPlayer.endorsementLevel}</span></span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSearchedPlayer(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <AlertCircle className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.section>

        {/* Main Analytics Section */}
        <motion.section variants={itemVariants} className="space-y-8">
          {/* Three Horizontal Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants}>
              <PickRateChart
                data={pickRatesData || []}
                loading={pickRatesLoading}
                error={pickRatesError?.message}
                limit={5}
                onHeroClick={handleHeroClick}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <WinRateChart
                data={winRatesData || []}
                loading={winRatesLoading}
                error={winRatesError?.message}
                limit={5}
                onHeroClick={handleHeroClick}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <TrendsChart
                data={trendsData || []}
                loading={trendsLoading}
                error={trendsError?.message}
                limit={6}
              />
            </motion.div>
          </div>

          {/* Rank Distribution Chart - Full Width */}
          <motion.div variants={itemVariants}>
            <RankDistributionChart
              loading={rankDistributionLoading}
              error={rankDistributionError?.message}
              triggerUpdate={rankDataUpdated}
            />
          </motion.div>
        </motion.section>

        {/* Footer */}
        <motion.footer 
          variants={itemVariants} 
          className="border-t border-border pt-8 mt-16"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gamepad2 className="h-4 w-4" />
              <span>OWMetaGG - Powered by OverFast API</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Data updates in real-time</span>
              <span>•</span>
              <span>Season {filters.season} Analytics</span>
              <span>•</span>
              <span>
                {apiHealthy === true ? (
                  <span className="text-green-500">OverFast Connected</span>
                ) : apiHealthy === false ? (
                  <span className="text-yellow-500">Using Mock Data</span>
                ) : (
                  <span className="text-blue-500">Connecting...</span>
                )}
              </span>
            </div>
          </div>
        </motion.footer>
      </motion.div>
    </div>
  );
}