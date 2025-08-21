'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Menu, 
  X, 
  BarChart3, 
  Users, 
  Trophy, 
  TrendingUp,
  User,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OVERWATCH_COLORS } from '@/types';

export interface NavbarProps {
  onNavigate?: (section: string) => void;
  onSearch?: (query: string) => void;
  activeSection?: string;
  isSearching?: boolean;
  searchHistory?: Array<{ battlenetId: string; searchedAt: string; found: boolean }>;
  onClearHistory?: () => void;
}

const NAVIGATION_ITEMS = [
  { id: 'meta-stats', label: 'Meta Statistics', icon: TrendingUp },
  { id: 'hero-stats', label: 'Hero Stats', icon: BarChart3 },
  { id: 'role-stats', label: 'Role Stats', icon: Users },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function Navbar({
  onNavigate,
  onSearch,
  activeSection = 'meta-stats',
  isSearching = false,
  searchHistory = [],
  onClearHistory
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [isValidBattleTag, setIsValidBattleTag] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Validate BattleNet ID format
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsValidBattleTag(false);
      return;
    }
    
    const regex = /^[a-zA-Z0-9]{3,12}#[0-9]{4,}$/;
    setIsValidBattleTag(regex.test(searchQuery.trim()));
  }, [searchQuery]);

  // Handle search submission
  const handleSearch = (query?: string) => {
    const searchTerm = (query || searchQuery).trim();
    if (!searchTerm || !isValidBattleTag) return;
    
    onSearch?.(searchTerm);
    setShowSearchHistory(false);
    setSearchQuery('');
  };

  // Handle navigation
  const handleNavigation = (sectionId: string) => {
    onNavigate?.(sectionId);
    setIsMobileMenuOpen(false);
  };

  // Handle click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSearchHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search history
  const filteredHistory = searchHistory.filter(item =>
    item.battlenetId.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border/50"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
              style={{ 
                background: `linear-gradient(135deg, ${OVERWATCH_COLORS.primary}40, ${OVERWATCH_COLORS.secondary}40)`,
                color: OVERWATCH_COLORS.primary
              }}
            >
              OW
            </div>
            <div className="hidden sm:block">
              <h1 
                className="text-xl font-bold tracking-tight"
                style={{ color: OVERWATCH_COLORS.primary }}
              >
                MetaGG
              </h1>
              <p className="text-xs text-muted-foreground">
                Overwatch Analytics
              </p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {NAVIGATION_ITEMS.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-primary-foreground shadow-sm' 
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  style={isActive ? { 
                    backgroundColor: OVERWATCH_COLORS.primary,
                    color: 'white'
                  } : {}}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Player#1234"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchHistory(searchHistory.length > 0)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className={`pl-10 pr-4 w-64 ${
                    searchQuery && !isValidBattleTag 
                      ? 'border-destructive focus-visible:ring-destructive/20'
                      : searchQuery && isValidBattleTag
                      ? 'border-green-500 focus-visible:ring-green-500/20'
                      : ''
                  }`}
                  disabled={isSearching}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchHistory(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search History Dropdown */}
              <AnimatePresence>
                {showSearchHistory && filteredHistory.length > 0 && (
                  <motion.div
                    ref={searchDropdownRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-1 z-50"
                  >
                    <Card className="bg-popover border shadow-lg">
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground font-medium">
                            Recent searches
                          </span>
                          <button
                            onClick={onClearHistory}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="space-y-1">
                          {filteredHistory.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearch(item.battlenetId)}
                              className="w-full flex items-center gap-2 p-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              {item.found ? (
                                <User className="h-3 w-3 text-green-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className="flex-1 text-left">{item.battlenetId}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(item.searchedAt).toLocaleDateString()}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={() => handleSearch()}
              disabled={!isValidBattleTag || isSearching}
              className="px-6"
              style={{ backgroundColor: OVERWATCH_COLORS.primary }}
            >
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Search (always visible on mobile) */}
        <div className="md:hidden mt-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Player#1234"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={`pl-10 pr-4 ${
                  searchQuery && !isValidBattleTag 
                    ? 'border-destructive'
                    : searchQuery && isValidBattleTag
                    ? 'border-green-500'
                    : ''
                }`}
                disabled={isSearching}
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={!isValidBattleTag || isSearching}
              size="sm"
              style={{ backgroundColor: OVERWATCH_COLORS.primary }}
            >
              {isSearching ? '...' : 'Search'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-background/98 backdrop-blur-sm"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="grid grid-cols-2 gap-2">
                {NAVIGATION_ITEMS.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'text-primary-foreground shadow-sm' 
                          : 'text-foreground hover:bg-accent'
                      }`}
                      style={isActive ? { 
                        backgroundColor: OVERWATCH_COLORS.primary,
                        color: 'white'
                      } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search validation message */}
      {searchQuery && !isValidBattleTag && (
        <div className="container mx-auto px-4 pb-2">
          <p className="text-xs text-destructive">
            Invalid format. Use: PlayerName#1234
          </p>
        </div>
      )}
    </motion.nav>
  );
}