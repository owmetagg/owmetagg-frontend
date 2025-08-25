import axios, { AxiosResponse } from 'axios';
import {
  Hero,
  HeroWinRate,
  HeroPickRate,
  RankDistribution,
  PlayerProfile,
  Season,
  TrendData,
  ApiError,
  HeroRole,
  Rank
} from '@/types';

const OVERFAST_BASE_URL = 'https://overfast-api.tekrop.fr';
const CURRENT_SEASON = 14;

// Rate limiting configuration
const RATE_LIMIT_DELAY = 34; // 30 requests/second = ~33ms between requests
let lastRequestTime = 0;

// Create axios instance with rate limiting
const overfastApi = axios.create({
  baseURL: OVERFAST_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
  },
});

// Rate limiting interceptor
overfastApi.interceptors.request.use(async (config) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  console.log(`OverFast API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor with retry logic
overfastApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 429) {
      // Rate limited, wait 5 seconds and retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      return overfastApi.request(error.config);
    }
    
    if (error.response?.status === 504) {
      // Gateway timeout, wait 2 seconds and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return overfastApi.request(error.config);
    }
    
    const apiError: ApiError = {
      error: error.response?.data?.error || 'OverFast API Error',
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      timestamp: new Date().toISOString(),
    };
    
    console.error('OverFast API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// OverFast API Types (matching their schema)
interface OverFastHero {
  key: string;
  name: string;
  portrait: string;
  role: 'tank' | 'damage' | 'support';
}

interface OverFastApiPlayerSummary {
  username: string;
  avatar: string;
  namecard: string;
  title: string;
  endorsement: {
    level: number;
    frame: string;
  };
  competitive: {
    pc: {
      season: number;
      tier: string;
      division: number;
      skill_rating: number;
      role_queue: {
        tank: { skill_rating: number; tier: string; division: number };
        damage: { skill_rating: number; tier: string; division: number };
        support: { skill_rating: number; tier: string; division: number };
      };
    };
  };
}

// Simplified interface for playerRankStorage compatibility
export interface OverFastPlayerSummary {
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

// Hero API endpoints (Real OverFast API)
export const overfastHeroApi = {
  // Get all heroes from OverFast API
  getAllHeroes: async (): Promise<Hero[]> => {
    try {
      const response: AxiosResponse<OverFastHero[]> = await overfastApi.get('/heroes');
      return response.data.map((hero, index) => ({
        id: index + 1,
        name: hero.name,
        role: hero.role.toUpperCase() as HeroRole,
        imageUrl: hero.portrait,
      }));
    } catch (error) {
      console.error('Failed to fetch heroes from OverFast API:', error);
      // Fallback to mock data
      return getMockHeroes();
    }
  },

  // Get heroes by role
  getHeroesByRole: async (role: HeroRole): Promise<Hero[]> => {
    const allHeroes = await overfastHeroApi.getAllHeroes();
    return allHeroes.filter(hero => hero.role === role);
  },
};

// Player API endpoints (Real OverFast API)
export const overfastPlayerApi = {
  // Search players (Note: OverFast doesn't have search, this is a direct lookup)
  searchPlayers: async (battleTag: string): Promise<PlayerProfile[]> => {
    try {
      // OverFast API expects battletag in format "Player-1234"
      const formattedTag = battleTag.replace('#', '-');
      const response: AxiosResponse<OverFastApiPlayerSummary> = await overfastApi.get(
        `/players/${encodeURIComponent(formattedTag)}/summary`
      );
      
      const data = response.data;
      const player: PlayerProfile = {
        battlenetId: battleTag,
        displayName: data.username,
        rank: mapOverfastRank(data.competitive?.pc?.tier || 'bronze'),
        skillRating: data.competitive?.pc?.skill_rating || 0,
        level: 1, // OverFast doesn't provide level in summary
        endorsementLevel: data.endorsement?.level || 1,
        competitiveStats: {
          gamesWon: 0, // Not available in OverFast summary
          gamesLost: 0,
          winRate: 0,
        },
        heroStats: [], // Would need additional API call to get hero stats
        lastUpdated: new Date().toISOString(),
      };
      
      return [player];
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        return []; // Player not found
      }
      throw error;
    }
  },

  // Get player profile
  getPlayerProfile: async (battleTag: string): Promise<PlayerProfile> => {
    const players = await overfastPlayerApi.searchPlayers(battleTag);
    if (players.length === 0) {
      throw new Error('Player not found');
    }
    return players[0];
  },

  // Get raw player summary for rank storage
  getPlayerSummary: async (battleTag: string): Promise<OverFastPlayerSummary> => {
    try {
      // OverFast API expects battletag in format "Player-1234"
      const formattedTag = battleTag.replace('#', '-');
      const response: AxiosResponse<OverFastApiPlayerSummary> = await overfastApi.get(
        `/players/${encodeURIComponent(formattedTag)}/summary`
      );
      
      // Transform API response to playerRankStorage compatible format
      const apiData = response.data;
      const transformedData: OverFastPlayerSummary = {
        username: apiData.username,
        competitive: {
          pc: {
            // Map role_queue data to direct role access format
            tank: apiData.competitive?.pc?.role_queue?.tank ? {
              division: apiData.competitive.pc.role_queue.tank.tier,
              tier: apiData.competitive.pc.role_queue.tank.division,
              skill_rating: apiData.competitive.pc.role_queue.tank.skill_rating,
            } : undefined,
            damage: apiData.competitive?.pc?.role_queue?.damage ? {
              division: apiData.competitive.pc.role_queue.damage.tier,
              tier: apiData.competitive.pc.role_queue.damage.division,
              skill_rating: apiData.competitive.pc.role_queue.damage.skill_rating,
            } : undefined,
            support: apiData.competitive?.pc?.role_queue?.support ? {
              division: apiData.competitive.pc.role_queue.support.tier,
              tier: apiData.competitive.pc.role_queue.support.division,
              skill_rating: apiData.competitive.pc.role_queue.support.skill_rating,
            } : undefined,
            // Open queue doesn't exist in role_queue, use overall competitive data
            open: apiData.competitive?.pc ? {
              division: apiData.competitive.pc.tier,
              tier: apiData.competitive.pc.division,
              skill_rating: apiData.competitive.pc.skill_rating,
            } : undefined,
          }
        }
      };
      
      return transformedData;
    } catch (error) {
      console.error('Failed to fetch player summary:', error);
      throw error;
    }
  },
};

// Mock data generators for aggregate statistics (OverFast doesn't provide these)
export const mockStatsApi = {
  // Generate hero pick rates
  getHeroPickRates: async (): Promise<HeroPickRate[]> => {
    const heroes = await overfastHeroApi.getAllHeroes();
    
    // Generate realistic pick rates (2-17%)
    const pickRates = heroes.map((hero, index) => {
      const baseRate = Math.max(2, 17 - (index * 0.5) + (Math.random() * 3));
      const gamesPlayed = Math.floor(Math.random() * 50000) + 10000;
      
      return {
        heroName: hero.name,
        heroId: hero.id,
        role: hero.role,
        pickRate: Number(baseRate.toFixed(1)),
        gamesPlayed,
        season: CURRENT_SEASON,
      };
    });
    
    return pickRates.sort((a, b) => b.pickRate - a.pickRate);
  },

  // Generate hero win rates
  getHeroWinRates: async (): Promise<HeroWinRate[]> => {
    const heroes = await overfastHeroApi.getAllHeroes();
    
    const winRates = heroes.map(hero => {
      // Generate win rates between 40-60% with some heroes being better
      const baseRate = 45 + (Math.random() * 15);
      const gamesPlayed = Math.floor(Math.random() * 30000) + 5000;
      
      return {
        heroName: hero.name,
        heroId: hero.id,
        role: hero.role,
        winRate: Number(baseRate.toFixed(1)),
        gamesPlayed,
        season: CURRENT_SEASON,
      };
    });
    
    return winRates.sort((a, b) => b.winRate - a.winRate);
  },

  // Generate rank distribution
  getRankDistribution: async (): Promise<RankDistribution[]> => {
    // Realistic Overwatch rank distribution
    const distributions = [
      { rank: Rank.BRONZE, percentage: 8.2 },
      { rank: Rank.SILVER, percentage: 21.4 },
      { rank: Rank.GOLD, percentage: 30.1 },
      { rank: Rank.PLATINUM, percentage: 25.3 },
      { rank: Rank.DIAMOND, percentage: 12.8 },
      { rank: Rank.MASTER, percentage: 1.8 },
      { rank: Rank.GRANDMASTER, percentage: 0.35 },
      { rank: Rank.TOP_500, percentage: 0.05 },
    ];
    
    const totalPlayers = 45000000; // Approximate total competitive players
    
    return distributions.map(dist => ({
      rank: dist.rank,
      percentage: dist.percentage,
      playerCount: Math.floor(totalPlayers * (dist.percentage / 100)),
      season: CURRENT_SEASON,
    }));
  },

  // Generate pick rate trends
  getPickRateTrends: async (): Promise<TrendData[]> => {
    const heroes = await overfastHeroApi.getAllHeroes();
    const trendingHeroes = heroes.slice(0, 6); // Top 6 heroes for trends
    
    return trendingHeroes.map(hero => {
      const currentRate = 8 + Math.random() * 12;
      const previousRate = currentRate + ((Math.random() - 0.5) * 6);
      const change = currentRate - previousRate;
      
      // Generate 30 days of data points
      const dataPoints = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        
        const progress = i / 29;
        const pickRate = previousRate + (change * progress) + ((Math.random() - 0.5) * 2);
        
        return {
          date: date.toISOString().split('T')[0],
          pickRate: Math.max(1, Number(pickRate.toFixed(1))),
        };
      });
      
      return {
        heroName: hero.name,
        heroId: hero.id,
        role: hero.role,
        currentPickRate: Number(currentRate.toFixed(1)),
        previousPickRate: Number(previousRate.toFixed(1)),
        pickRateChange: Number(change.toFixed(1)),
        trend: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
        timeframe: '30 days',
        dataPoints,
      };
    });
  },
};

// Season API with Season 14 as current
export const overfastSeasonApi = {
  getSeasons: async (): Promise<Season[]> => {
    return [
      {
        id: 14,
        name: 'Season 14',
        displayName: 'Season 14 (Current)',
        isCurrent: true,
        startDate: '2024-12-10',
      },
      {
        id: 13,
        name: 'Season 13',
        displayName: 'Season 13',
        isCurrent: false,
        startDate: '2024-10-15',
        endDate: '2024-12-09',
      },
      {
        id: 12,
        name: 'Season 12',
        displayName: 'Season 12',
        isCurrent: false,
        startDate: '2024-08-20',
        endDate: '2024-10-14',
      },
      {
        id: 11,
        name: 'Season 11',
        displayName: 'Season 11',
        isCurrent: false,
        startDate: '2024-06-18',
        endDate: '2024-08-19',
      },
    ];
  },

  getCurrentSeason: async (): Promise<Season> => {
    const seasons = await overfastSeasonApi.getSeasons();
    return seasons.find(s => s.isCurrent) || seasons[0];
  },
};

// Utility functions
const mapOverfastRank = (overfastTier: string): Rank => {
  const tier = overfastTier.toLowerCase();
  if (tier.includes('bronze')) return Rank.BRONZE;
  if (tier.includes('silver')) return Rank.SILVER;
  if (tier.includes('gold')) return Rank.GOLD;
  if (tier.includes('platinum')) return Rank.PLATINUM;
  if (tier.includes('diamond')) return Rank.DIAMOND;
  if (tier.includes('master')) return Rank.MASTER;
  if (tier.includes('grandmaster')) return Rank.GRANDMASTER;
  if (tier.includes('top 500')) return Rank.TOP_500;
  return Rank.BRONZE;
};

const getMockHeroes = (): Hero[] => [
  // Tank Heroes
  { id: 1, name: 'D.Va', role: HeroRole.TANK },
  { id: 2, name: 'Doomfist', role: HeroRole.TANK },
  { id: 3, name: 'Junker Queen', role: HeroRole.TANK },
  { id: 4, name: 'Mauga', role: HeroRole.TANK },
  { id: 5, name: 'Orisa', role: HeroRole.TANK },
  { id: 6, name: 'Ramattra', role: HeroRole.TANK },
  { id: 7, name: 'Reinhardt', role: HeroRole.TANK },
  { id: 8, name: 'Roadhog', role: HeroRole.TANK },
  { id: 9, name: 'Sigma', role: HeroRole.TANK },
  { id: 10, name: 'Winston', role: HeroRole.TANK },
  { id: 11, name: 'Wrecking Ball', role: HeroRole.TANK },
  { id: 12, name: 'Zarya', role: HeroRole.TANK },
  
  // Damage Heroes
  { id: 13, name: 'Ashe', role: HeroRole.DAMAGE },
  { id: 14, name: 'Bastion', role: HeroRole.DAMAGE },
  { id: 15, name: 'Cassidy', role: HeroRole.DAMAGE },
  { id: 16, name: 'Echo', role: HeroRole.DAMAGE },
  { id: 17, name: 'Genji', role: HeroRole.DAMAGE },
  { id: 18, name: 'Hanzo', role: HeroRole.DAMAGE },
  { id: 19, name: 'Junkrat', role: HeroRole.DAMAGE },
  { id: 20, name: 'Mei', role: HeroRole.DAMAGE },
  { id: 21, name: 'Pharah', role: HeroRole.DAMAGE },
  { id: 22, name: 'Reaper', role: HeroRole.DAMAGE },
  { id: 23, name: 'Soldier: 76', role: HeroRole.DAMAGE },
  { id: 24, name: 'Sojourn', role: HeroRole.DAMAGE },
  { id: 25, name: 'Sombra', role: HeroRole.DAMAGE },
  { id: 26, name: 'Symmetra', role: HeroRole.DAMAGE },
  { id: 27, name: 'Torbjörn', role: HeroRole.DAMAGE },
  { id: 28, name: 'Tracer', role: HeroRole.DAMAGE },
  { id: 29, name: 'Venture', role: HeroRole.DAMAGE },
  { id: 30, name: 'Widowmaker', role: HeroRole.DAMAGE },
  
  // Support Heroes
  { id: 31, name: 'Ana', role: HeroRole.SUPPORT },
  { id: 32, name: 'Baptiste', role: HeroRole.SUPPORT },
  { id: 33, name: 'Brigitte', role: HeroRole.SUPPORT },
  { id: 34, name: 'Juno', role: HeroRole.SUPPORT },
  { id: 35, name: 'Kiriko', role: HeroRole.SUPPORT },
  { id: 36, name: 'Lifeweaver', role: HeroRole.SUPPORT },
  { id: 37, name: 'Lúcio', role: HeroRole.SUPPORT },
  { id: 38, name: 'Mercy', role: HeroRole.SUPPORT },
  { id: 39, name: 'Moira', role: HeroRole.SUPPORT },
  { id: 40, name: 'Zenyatta', role: HeroRole.SUPPORT },
];

// API utilities
export const overfastApiUtils = {
  validateBattleNetId: (battlenetId: string): boolean => {
    const regex = /^[a-zA-Z0-9]{3,12}#[0-9]{4,}$/;
    return regex.test(battlenetId);
  },

  formatBattleNetId: (battlenetId: string): string => {
    return battlenetId.replace('#', '-');
  },

  parseBattleNetId: (battlenetId: string): string => {
    return battlenetId.replace('-', '#');
  },

  handleApiError: (error: ApiError): string => {
    switch (error.status) {
      case 404:
        return 'Player not found. Please check the BattleNet ID.';
      case 429:
        return 'Too many requests. Please try again in a few seconds.';
      case 504:
        return 'Server timeout. Please try again.';
      case 500:
        return 'OverFast API error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  },
};

export default overfastApi;