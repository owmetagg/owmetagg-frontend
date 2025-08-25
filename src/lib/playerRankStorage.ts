// Types are defined locally in this file

export interface PlayerRankData {
  playerId: string;
  username: string;
  division: string;        // "diamond", "master", etc. from API
  tier: number;           // 1-5 from API
  role: string;           // "tank", "damage", "support", "open"
  season: number;         // Competitive season when data was collected
  searchedAt: string;     // Timestamp when searched
}

export interface RankTierData {
  rank: string;           // Display name: "Diamond"
  apiRank: string;        // API name: "diamond"
  tier: number;          // 1-5
  count: number;         // Actual player count with this rank/tier
  percentage: number;    // Percentage of searched players
  fill: string;         // Rank-specific color
  tierDisplay: string;  // "Diamond 3"
}

export interface SeasonStats {
  totalEntries: number;
  uniquePlayers: number;
  rolesTracked: string[];
  dateRange: {
    earliest: Date;
    latest: Date;
  } | null;
}

// OverFast API player summary interface
interface OverFastPlayerSummary {
  username: string;
  competitive?: {
    pc?: {
      tank?: {
        division: string;
        tier: number;
        skill_rating?: number;
      };
      damage?: {
        division: string;
        tier: number;
        skill_rating?: number;
      };
      support?: {
        division: string;
        tier: number;
        skill_rating?: number;
      };
      open?: {
        division: string;
        tier: number;
        skill_rating?: number;
      };
    };
  };
}

const STORAGE_KEY = 'owmetagg_player_ranks';
const CURRENT_SEASON = 14; // Updated to current season

// Rank order for sorting (lowest to highest)
const RANK_ORDER: Record<string, number> = {
  'bronze': 1,
  'silver': 2,
  'gold': 3,
  'platinum': 4,
  'diamond': 5,
  'master': 6,
  'grandmaster': 7,
  'champion': 8,
  'ultimate': 8, // API uses 'ultimate' for Champion
};

// Official Overwatch rank colors with tier variations
const RANK_COLORS: Record<string, string> = {
  'bronze': '#CD7F32',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'platinum': '#E5E4E2',
  'diamond': '#B9F2FF',
  'master': '#FFB84D',
  'grandmaster': '#FF6B6B',
  'champion': '#FF1744',
  'ultimate': '#FF1744',
};

// Display names for ranks
const RANK_DISPLAY_NAMES: Record<string, string> = {
  'bronze': 'Bronze',
  'silver': 'Silver',
  'gold': 'Gold',
  'platinum': 'Platinum',
  'diamond': 'Diamond',
  'master': 'Master',
  'grandmaster': 'Grandmaster',
  'champion': 'Champion',
  'ultimate': 'Champion',
};

// Extract rank data from OverFast API response
const extractRankData = (playerSummary: OverFastPlayerSummary, season: number): PlayerRankData[] => {
  const rankData: PlayerRankData[] = [];
  const competitive = playerSummary.competitive;
  
  if (competitive?.pc) {
    (['tank', 'damage', 'support', 'open'] as const).forEach(role => {
      const roleRank = competitive.pc?.[role];
      if (roleRank?.division && roleRank?.tier) {
        // Normalize the division name
        const division = roleRank.division.toLowerCase();
        
        rankData.push({
          playerId: playerSummary.username,
          username: playerSummary.username,
          division: division,
          tier: roleRank.tier,
          role: role,
          season: season,
          searchedAt: new Date().toISOString()
        });
      }
    });
  }
  
  return rankData;
};

// Generate chart data from searched players
const generateRealTierData = (searchedPlayers: PlayerRankData[]): RankTierData[] => {
  if (searchedPlayers.length === 0) return [];
  
  // Group players by rank and tier
  const tierCounts = new Map<string, number>();
  
  searchedPlayers.forEach(player => {
    const key = `${player.division}-${player.tier}`;
    tierCounts.set(key, (tierCounts.get(key) || 0) + 1);
  });
  
  // Convert to chart data
  const tierData: RankTierData[] = [];
  const totalPlayers = searchedPlayers.length;
  
  tierCounts.forEach((count, key) => {
    const [apiRank, tierStr] = key.split('-');
    const tier = parseInt(tierStr);
    const displayName = RANK_DISPLAY_NAMES[apiRank] || apiRank;
    
    tierData.push({
      rank: displayName,
      apiRank: apiRank,
      tier: tier,
      count: count,
      percentage: (count / totalPlayers) * 100,
      fill: RANK_COLORS[apiRank] || '#6B7280',
      tierDisplay: `${displayName} ${tier}`
    });
  });
  
  // Sort by rank order, then by tier (highest tier first within each rank)
  return tierData.sort((a, b) => {
    const rankOrderA = RANK_ORDER[a.apiRank] || 0;
    const rankOrderB = RANK_ORDER[b.apiRank] || 0;
    const rankDiff = rankOrderA - rankOrderB;
    
    if (rankDiff !== 0) return rankDiff;
    
    // Within same rank, sort by tier (1-5, with 1 being highest)
    return a.tier - b.tier;
  });
};

// Get rank icon URL from OverFast API
const getRankIcon = (apiRank: string): string => {
  // OverFast API provides rank icons
  return `https://overfast-api.tekrop.fr/static/ranks/${apiRank}.png`;
};

// Main player rank storage utility
export const playerRankStorage = {
  // Add a searched player's rank data
  addPlayer: (playerSummary: OverFastPlayerSummary, season: number = CURRENT_SEASON): void => {
    const rankData = extractRankData(playerSummary, season);
    
    if (rankData.length > 0) {
      const existing = playerRankStorage.getStoredPlayers();
      
      // Remove any existing data for this player in this season to avoid duplicates
      const filtered = existing.filter(p => 
        !(p.playerId === rankData[0].playerId && p.season === season)
      );
      
      const updated = [...filtered, ...rankData];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  // Get all stored players
  getStoredPlayers: (): PlayerRankData[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load stored player ranks:', error);
      return [];
    }
  },

  // Get players filtered by season
  getPlayersBySeason: (season: number): PlayerRankData[] => {
    const stored = playerRankStorage.getStoredPlayers();
    return stored.filter(player => player.season === season);
  },

  // Get seasons that have actual data
  getSeasonsWithData: (): number[] => {
    const players = playerRankStorage.getStoredPlayers();
    const seasons = [...new Set(players.map(p => p.season))];
    return seasons.sort((a, b) => b - a); // Most recent first
  },

  // Get all possible seasons (1-14, with 14 being current)
  getAllSeasons: (): number[] => {
    return Array.from({length: 14}, (_, i) => i + 1).reverse(); // 14 to 1
  },

  // Get season statistics
  getSeasonStats: (season: number): SeasonStats => {
    const players = playerRankStorage.getPlayersBySeason(season);
    const uniquePlayers = new Set(players.map(p => p.playerId)).size;
    const timestamps = players.map(p => new Date(p.searchedAt).getTime());
    
    return {
      totalEntries: players.length,
      uniquePlayers: uniquePlayers,
      rolesTracked: ['tank', 'damage', 'support', 'open'].filter(role => 
        players.some(p => p.role === role)
      ),
      dateRange: players.length > 0 ? {
        earliest: new Date(Math.min(...timestamps)),
        latest: new Date(Math.max(...timestamps))
      } : null
    };
  },

  // Generate rank distribution data for chart
  generateDistributionData: (season: number): RankTierData[] => {
    const players = playerRankStorage.getPlayersBySeason(season);
    return generateRealTierData(players);
  },

  // Clear all data
  clearAll: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Clear specific season data
  clearSeason: (season: number): void => {
    if (season < 1 || season > 14) return;
    
    const players = playerRankStorage.getStoredPlayers();
    const filtered = players.filter(p => p.season !== season);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Get current season
  getCurrentSeason: (): number => {
    return CURRENT_SEASON;
  },

  // Utility functions
  getRankIcon,
  getRankDisplayName: (apiRank: string): string => {
    return RANK_DISPLAY_NAMES[apiRank] || apiRank;
  },
  getRankColor: (apiRank: string): string => {
    return RANK_COLORS[apiRank] || '#6B7280';
  },
  
  // Get summary statistics across all seasons
  getOverallStats: () => {
    const players = playerRankStorage.getStoredPlayers();
    const seasons = playerRankStorage.getSeasonsWithData();
    const uniquePlayers = new Set(players.map(p => p.playerId)).size;
    
    return {
      totalPlayers: uniquePlayers,
      totalEntries: players.length,
      seasonsTracked: seasons.length,
      oldestEntry: players.length > 0 
        ? new Date(Math.min(...players.map(p => new Date(p.searchedAt).getTime())))
        : null,
      newestEntry: players.length > 0
        ? new Date(Math.max(...players.map(p => new Date(p.searchedAt).getTime())))
        : null
    };
  }
};

export default playerRankStorage;