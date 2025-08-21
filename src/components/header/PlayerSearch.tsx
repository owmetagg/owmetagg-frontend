'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { playerApi, apiUtils } from '@/lib/api';
import { PlayerProfile, SearchHistory } from '@/types';

interface PlayerSearchProps {
  onPlayerFound?: (player: PlayerProfile) => void;
  onSearchStart?: () => void;
  onSearchComplete?: () => void;
}

export function PlayerSearch({ 
  onPlayerFound, 
  onSearchStart, 
  onSearchComplete 
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('owmeta-search-history');
      if (stored) {
        const history = JSON.parse(stored) as SearchHistory[];
        setSearchHistory(history.slice(0, 5)); // Keep only last 5 searches
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage
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

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('owmeta-search-history');
  };

  // Validate BattleNet ID format
  useEffect(() => {
    if (!query.trim()) {
      setIsValid(false);
      setError(null);
      return;
    }

    const valid = apiUtils.validateBattleNetId(query.trim());
    setIsValid(valid);
    
    if (!valid && query.length > 3) {
      setError('Invalid format. Use: PlayerName#1234');
    } else {
      setError(null);
    }
  }, [query]);

  // Handle search
  const handleSearch = async (searchQuery?: string) => {
    const searchTerm = (searchQuery || query).trim();
    
    if (!searchTerm || !apiUtils.validateBattleNetId(searchTerm)) {
      setError('Please enter a valid BattleNet ID (e.g., Player#1234)');
      return;
    }

    setIsLoading(true);
    setError(null);
    onSearchStart?.();

    try {
      const formattedId = apiUtils.formatBattleNetId(searchTerm);
      const player = await playerApi.getPlayerProfile(formattedId);
      
      onPlayerFound?.(player);
      saveSearchHistory(searchTerm, true);
      setShowSuggestions(false);
      
      // Clear the search input after successful search
      setQuery('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred.';
      setError(errorMessage);
      saveSearchHistory(searchTerm, false);
    } finally {
      setIsLoading(false);
      onSearchComplete?.();
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Show suggestions when typing and have history
    if (value.length > 0 && searchHistory.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchHistory.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = searchHistory.filter(item =>
    item.battlenetId.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter BattleNet ID (e.g., Player#1234)"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              className={`pl-10 pr-4 ${
                error
                  ? 'border-destructive focus-visible:ring-destructive/20'
                  : isValid && query
                  ? 'border-green-500 focus-visible:ring-green-500/20'
                  : ''
              }`}
              disabled={isLoading}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <Card
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover border shadow-lg"
            >
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium">Recent searches</span>
                  <button
                    onClick={clearSearchHistory}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {filteredSuggestions.map((item, index) => (
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
          )}
        </div>

        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="px-6"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            'Search'
          )}
        </Button>
      </form>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      {/* Format Help */}
      {!query && !error && (
        <p className="text-xs text-muted-foreground mt-1">
          Format: PlayerName#1234
        </p>
      )}
    </div>
  );
}