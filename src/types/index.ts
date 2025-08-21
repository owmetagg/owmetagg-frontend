export enum HeroRole {
  TANK = 'TANK',
  DAMAGE = 'DAMAGE',
  SUPPORT = 'SUPPORT'
}

export enum Rank {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  MASTER = 'MASTER',
  GRANDMASTER = 'GRANDMASTER',
  TOP_500 = 'TOP_500'
}

export interface Hero {
  id: number;
  name: string;
  role: HeroRole;
  imageUrl?: string;
  description?: string;
}

export interface HeroWinRate {
  heroName: string;
  heroId: number;
  role: HeroRole;
  winRate: number;
  gamesPlayed: number;
  rank?: Rank;
  season: number;
}

export interface HeroPickRate {
  heroName: string;
  heroId: number;
  role: HeroRole;
  pickRate: number;
  gamesPlayed: number;
  rank?: Rank;
  season: number;
}

export interface RankDistribution {
  rank: Rank;
  playerCount: number;
  percentage: number;
  season: number;
}

export interface HeroPerformance {
  heroName: string;
  heroId: number;
  role: HeroRole;
  winRate: number;
  pickRate: number;
  banRate?: number;
  averageDamage?: number;
  averageHealing?: number;
  averageEliminations?: number;
  averageDeaths?: number;
  kdr?: number;
  rank?: Rank;
  season: number;
}

export interface PlayerProfile {
  battlenetId: string;
  displayName: string;
  rank: Rank;
  skillRating: number;
  level: number;
  endorsementLevel: number;
  competitiveStats?: {
    gamesWon: number;
    gamesLost: number;
    winRate: number;
  };
  heroStats: Array<{
    heroName: string;
    timePlayed: number;
    gamesWon: number;
    gamesLost: number;
    winRate: number;
  }>;
  lastUpdated: string;
}

export interface Season {
  id: number;
  name: string;
  displayName: string;
  isCurrent: boolean;
  startDate: string;
  endDate?: string;
}

export interface TrendData {
  heroName: string;
  heroId: number;
  role: HeroRole;
  currentPickRate: number;
  previousPickRate: number;
  pickRateChange: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
  dataPoints: Array<{
    date: string;
    pickRate: number;
  }>;
}

export interface DashboardFilters {
  season: number;
  rank?: Rank;
  role?: HeroRole;
  searchQuery?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  timestamp: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  role?: HeroRole;
  color?: string;
  percentage?: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description: string;
}

export interface SearchHistory {
  battlenetId: string;
  searchedAt: string;
  found: boolean;
}

export interface LoadingState {
  heroes: boolean;
  winRates: boolean;
  pickRates: boolean;
  trends: boolean;
  rankDistribution: boolean;
  playerSearch: boolean;
}

export interface ErrorState {
  heroes?: string;
  winRates?: string;
  pickRates?: string;
  trends?: string;
  rankDistribution?: string;
  playerSearch?: string;
}

// Constants
export const RANK_COLORS: Record<Rank, string> = {
  [Rank.BRONZE]: '#CD7F32',
  [Rank.SILVER]: '#C0C0C0',
  [Rank.GOLD]: '#FFD700',
  [Rank.PLATINUM]: '#E5E4E2',
  [Rank.DIAMOND]: '#B9F2FF',
  [Rank.MASTER]: '#FFB84D',
  [Rank.GRANDMASTER]: '#FF6B6B',
  [Rank.TOP_500]: '#FF1744'
};

export const ROLE_COLORS: Record<HeroRole, string> = {
  [HeroRole.TANK]: '#3B82F6',     // Blue
  [HeroRole.DAMAGE]: '#EF4444',   // Red
  [HeroRole.SUPPORT]: '#10B981'   // Green
};

export const OVERWATCH_COLORS = {
  primary: '#F99E1A',      // Overwatch Orange
  secondary: '#00D4FF',    // Overwatch Blue
  accent: '#FF6B35',       // Accent Orange
  background: '#0F172A',   // Dark Background
  surface: '#1E293B',      // Card Background
  text: '#F8FAFC',         // Light Text
  muted: '#64748B'         // Muted Text
} as const;