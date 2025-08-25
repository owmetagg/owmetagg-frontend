'use client';

import { useState } from 'react';
import { BarChart3, Users, Trophy, TrendingUp, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NavigationItem } from '@/types';

interface NavigationButtonsProps {
  activeSection?: string;
  onSectionChange?: (sectionId: string) => void;
  disabled?: boolean;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'hero-stats',
    label: 'Hero Statistics',
    icon: 'BarChart3',
    path: '/heroes',
    description: 'Individual hero performance and analytics',
  },
  {
    id: 'role-stats',
    label: 'Role Statistics',
    icon: 'Users',
    path: '/roles',
    description: 'Tank, Damage, and Support role analysis',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: 'Trophy',
    path: '/leaderboard',
    description: 'Top players and competitive rankings',
  },
  {
    id: 'meta-stats',
    label: 'Meta Statistics',
    icon: 'TrendingUp',
    path: '/meta',
    description: 'Current meta trends and insights',
  },
];

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'BarChart3':
      return BarChart3;
    case 'Users':
      return Users;
    case 'Trophy':
      return Trophy;
    case 'TrendingUp':
      return TrendingUp;
    default:
      return BarChart3;
  }
};

export function NavigationButtons({ 
  activeSection = 'hero-stats', 
  onSectionChange, 
  disabled = false 
}: NavigationButtonsProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemClick = (item: NavigationItem) => {
    if (disabled) return;
    onSectionChange?.(item.id);
  };

  return (
    <div className="w-full">
      {/* Mobile Navigation - Horizontal Scroll */}
      <div className="block md:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {NAVIGATION_ITEMS.map((item) => {
            const IconComponent = getIcon(item.icon);
            const isActive = activeSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "outline"}
                onClick={() => handleItemClick(item)}
                disabled={disabled}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <Badge variant="secondary" className="ml-1 bg-primary-foreground/20 text-primary-foreground text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Desktop Navigation - Grid Layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {NAVIGATION_ITEMS.map((item) => {
          const IconComponent = getIcon(item.icon);
          const isActive = activeSection === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <Card
              key={item.id}
              className={`relative cursor-pointer transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg border-primary' 
                  : 'hover:shadow-md hover:border-primary/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => !disabled && setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    isActive 
                      ? 'bg-primary-foreground/20' 
                      : 'bg-primary/10 group-hover:bg-primary/20'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      isActive ? 'text-primary-foreground' : 'text-primary'
                    }`} />
                  </div>
                  
                  {(isActive || isHovered) && (
                    <ChevronRight className={`h-4 w-4 transition-transform ${
                      isActive ? 'text-primary-foreground' : 'text-primary'
                    } ${isHovered ? 'translate-x-1' : ''}`} />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-base ${
                      isActive ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {item.label}
                    </h3>
                    {isActive && (
                      <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${
                    isActive 
                      ? 'text-primary-foreground/80' 
                      : 'text-muted-foreground'
                  }`}>
                    {item.description}
                  </p>
                </div>

                {/* Coming Soon Badge for non-active items */}
                {!isActive && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Coming Soon
                    </Badge>
                  </div>
                )}
              </div>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground/30 rounded-b-lg" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Section Description */}
      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-sm font-medium text-foreground">Current View:</span>
          <span className="text-sm text-muted-foreground">
            {NAVIGATION_ITEMS.find(item => item.id === activeSection)?.description || 'Dashboard overview with key metrics and trends'}
          </span>
        </div>
      </div>
    </div>
  );
}