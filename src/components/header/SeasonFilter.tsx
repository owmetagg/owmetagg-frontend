'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { overfastSeasonApi } from '@/lib/overfast-api';
import { Season } from '@/types';

interface SeasonFilterProps {
  selectedSeason?: number;
  onSeasonChange?: (season: number) => void;
  disabled?: boolean;
}

export function SeasonFilter({ 
  selectedSeason, 
  onSeasonChange, 
  disabled = false 
}: SeasonFilterProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load seasons on mount
  useEffect(() => {
    const loadSeasons = async () => {
      try {
        setLoading(true);
        setError(null);
        const seasonsData = await overfastSeasonApi.getSeasons();
        setSeasons(seasonsData);

        // If no season is selected, default to current season
        if (!selectedSeason && seasonsData.length > 0) {
          const currentSeason = seasonsData.find(s => s.isCurrent) || seasonsData[0];
          onSeasonChange?.(currentSeason.id);
        }
      } catch (error) {
        console.error('Failed to load seasons:', error);
        setError('Failed to load seasons');
      } finally {
        setLoading(false);
      }
    };

    loadSeasons();
  }, [selectedSeason, onSeasonChange]);

  // Get current season info
  const currentSeason = seasons.find(s => s.id === selectedSeason);

  // Handle season change
  const handleSeasonChange = (value: string) => {
    const seasonId = parseInt(value, 10);
    onSeasonChange?.(seasonId);
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('owmeta-selected-season', seasonId.toString());
    } catch (error) {
      console.error('Failed to save season preference:', error);
    }
  };

  // Load saved season preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('owmeta-selected-season');
      if (saved && !selectedSeason) {
        const seasonId = parseInt(saved, 10);
        const season = seasons.find(s => s.id === seasonId);
        if (season) {
          onSeasonChange?.(seasonId);
        }
      }
    } catch (error) {
      console.error('Failed to load season preference:', error);
    }
  }, [seasons, selectedSeason, onSeasonChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-9 w-40" />
      </div>
    );
  }

  if (error || !seasons.length) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="text-sm">Season data unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedSeason?.toString()}
        onValueChange={handleSeasonChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select season">
            <div className="flex items-center gap-2">
              {currentSeason?.displayName}
              {currentSeason?.isCurrent && (
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                  Current
                </Badge>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {seasons.map((season) => (
            <SelectItem 
              key={season.id} 
              value={season.id.toString()}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{season.name}</span>
                    {season.isCurrent && (
                      <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {season.startDate && (
                      <>
                        {new Date(season.startDate).toLocaleDateString()}
                        {season.endDate && (
                          <> - {new Date(season.endDate).toLocaleDateString()}</>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {selectedSeason === season.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Season Info */}
      {currentSeason && (
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
          {currentSeason.isCurrent ? (
            <span className="text-primary font-medium">Live Data</span>
          ) : (
            <span>Historical Data</span>
          )}
        </div>
      )}
    </div>
  );
}