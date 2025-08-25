import axios, { AxiosResponse } from 'axios';
import {
  Hero,
  HeroWinRate,
  HeroPickRate,
  RankDistribution,
  HeroPerformance,
  PlayerProfile,
  Season,
  TrendData,
  ApiError,
  HeroRole,
  Rank
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://overfast-api.tekrop.fr';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const apiError: ApiError = {
      error: error.response?.data?.error || 'Unknown error',
      message: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      timestamp: new Date().toISOString(),
    };
    
    console.error('API Error:', apiError);
    return Promise.reject(apiError);
  }
);

// Hero API endpoints
export const heroApi = {
  // Get all heroes
  getAllHeroes: async (): Promise<Hero[]> => {
    const response: AxiosResponse<Hero[]> = await api.get('/api/v1/heroes');
    return response.data;
  },

  // Get hero by ID
  getHeroById: async (id: number): Promise<Hero> => {
    const response: AxiosResponse<Hero> = await api.get(`/api/v1/heroes/${id}`);
    return response.data;
  },

  // Get heroes by role
  getHeroesByRole: async (role: HeroRole): Promise<Hero[]> => {
    const response: AxiosResponse<Hero[]> = await api.get(`/api/v1/heroes/role/${role}`);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response: AxiosResponse<{ status: string }> = await api.get('/api/v1/heroes/health');
    return response.data;
  },
};

// Stats API endpoints
export const statsApi = {
  // Get hero win rates
  getHeroWinRates: async (params: {
    rank?: Rank;
    role?: HeroRole;
    season?: number;
  } = {}): Promise<HeroWinRate[]> => {
    const searchParams = new URLSearchParams();
    if (params.rank) searchParams.append('rank', params.rank);
    if (params.role) searchParams.append('role', params.role);
    if (params.season) searchParams.append('season', params.season.toString());

    const response: AxiosResponse<HeroWinRate[]> = await api.get(
      `/api/v1/stats/hero-winrates?${searchParams.toString()}`
    );
    return response.data;
  },

  // Get hero pick rates
  getHeroPickRates: async (params: {
    rank?: Rank;
    role?: HeroRole;
    season?: number;
  } = {}): Promise<HeroPickRate[]> => {
    const searchParams = new URLSearchParams();
    if (params.rank) searchParams.append('rank', params.rank);
    if (params.role) searchParams.append('role', params.role);
    if (params.season) searchParams.append('season', params.season.toString());

    const response: AxiosResponse<HeroPickRate[]> = await api.get(
      `/api/v1/stats/hero-pickrates?${searchParams.toString()}`
    );
    return response.data;
  },

  // Get rank distribution
  getRankDistribution: async (season?: number): Promise<RankDistribution[]> => {
    const searchParams = new URLSearchParams();
    if (season) searchParams.append('season', season.toString());

    const response: AxiosResponse<RankDistribution[]> = await api.get(
      `/api/v1/stats/rank-distribution?${searchParams.toString()}`
    );
    return response.data;
  },

  // Get detailed hero performance
  getHeroPerformance: async (
    heroName: string,
    params: {
      rank?: Rank;
      season?: number;
    } = {}
  ): Promise<HeroPerformance> => {
    const searchParams = new URLSearchParams();
    if (params.rank) searchParams.append('rank', params.rank);
    if (params.season) searchParams.append('season', params.season.toString());

    const response: AxiosResponse<HeroPerformance> = await api.get(
      `/api/v1/stats/hero-performance/${encodeURIComponent(heroName)}?${searchParams.toString()}`
    );
    return response.data;
  },
};

// Player API endpoints
export const playerApi = {
  // Get player profile by BattleNet ID
  getPlayerProfile: async (battlenetId: string): Promise<PlayerProfile> => {
    const response: AxiosResponse<PlayerProfile> = await api.get(
      `/api/v1/players/${encodeURIComponent(battlenetId)}`
    );
    return response.data;
  },
};

// Mock data for trends (since endpoint not specified in backend)
export const trendsApi = {
  // Get pick rate trends (mock implementation)
  getPickRateTrends: async (): Promise<TrendData[]> => {
    // Mock implementation - in real app this would be a backend endpoint
    const mockTrends: TrendData[] = [
      {
        heroName: 'Reinhardt',
        heroId: 1,
        role: HeroRole.TANK,
        currentPickRate: 23.5,
        previousPickRate: 19.2,
        pickRateChange: 4.3,
        trend: 'up',
        timeframe: '30 days',
        dataPoints: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pickRate: 19.2 + (4.3 * i / 29) + (Math.random() - 0.5) * 2,
        })),
      },
      {
        heroName: 'Genji',
        heroId: 2,
        role: HeroRole.DAMAGE,
        currentPickRate: 18.7,
        previousPickRate: 22.1,
        pickRateChange: -3.4,
        trend: 'down',
        timeframe: '30 days',
        dataPoints: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pickRate: 22.1 - (3.4 * i / 29) + (Math.random() - 0.5) * 2,
        })),
      },
      {
        heroName: 'Ana',
        heroId: 3,
        role: HeroRole.SUPPORT,
        currentPickRate: 28.9,
        previousPickRate: 25.6,
        pickRateChange: 3.3,
        trend: 'up',
        timeframe: '30 days',
        dataPoints: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pickRate: 25.6 + (3.3 * i / 29) + (Math.random() - 0.5) * 1.5,
        })),
      },
      {
        heroName: 'Tracer',
        heroId: 4,
        role: HeroRole.DAMAGE,
        currentPickRate: 15.2,
        previousPickRate: 13.8,
        pickRateChange: 1.4,
        trend: 'up',
        timeframe: '30 days',
        dataPoints: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pickRate: 13.8 + (1.4 * i / 29) + (Math.random() - 0.5) * 1,
        })),
      },
      {
        heroName: 'Mercy',
        heroId: 5,
        role: HeroRole.SUPPORT,
        currentPickRate: 31.4,
        previousPickRate: 33.2,
        pickRateChange: -1.8,
        trend: 'down',
        timeframe: '30 days',
        dataPoints: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          pickRate: 33.2 - (1.8 * i / 29) + (Math.random() - 0.5) * 1.2,
        })),
      },
    ];

    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTrends), 500); // Simulate API delay
    });
  },
};

// Season API (mock implementation)
export const seasonApi = {
  // Get available seasons
  getSeasons: async (): Promise<Season[]> => {
    const mockSeasons: Season[] = [
      {
        id: 13,
        name: 'Season 13',
        displayName: 'Season 13 (Current)',
        isCurrent: true,
        startDate: '2024-02-01',
      },
      {
        id: 12,
        name: 'Season 12',
        displayName: 'Season 12',
        isCurrent: false,
        startDate: '2023-12-01',
        endDate: '2024-01-31',
      },
      {
        id: 11,
        name: 'Season 11',
        displayName: 'Season 11',
        isCurrent: false,
        startDate: '2023-10-01',
        endDate: '2023-11-30',
      },
      {
        id: 10,
        name: 'Season 10',
        displayName: 'Season 10',
        isCurrent: false,
        startDate: '2023-08-01',
        endDate: '2023-09-30',
      },
    ];

    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSeasons), 200);
    });
  },

  // Get current season
  getCurrentSeason: async (): Promise<Season> => {
    const seasons = await seasonApi.getSeasons();
    return seasons.find(s => s.isCurrent) || seasons[0];
  },
};

// Utility functions
export const apiUtils = {
  // Validate BattleNet ID format
  validateBattleNetId: (battlenetId: string): boolean => {
    const regex = /^[a-zA-Z0-9]{3,12}#[0-9]{4,}$/;
    return regex.test(battlenetId);
  },

  // Format BattleNet ID for API
  formatBattleNetId: (battlenetId: string): string => {
    return battlenetId.replace('#', '-');
  },

  // Parse BattleNet ID from API format
  parseBattleNetId: (battlenetId: string): string => {
    return battlenetId.replace('-', '#');
  },

  // Handle API errors
  handleApiError: (error: ApiError): string => {
    switch (error.status) {
      case 404:
        return 'Player not found. Please check the BattleNet ID.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  },
};

export default api;