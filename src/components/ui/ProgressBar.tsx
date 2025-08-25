'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // Percentage value (0-100)
  color?: 'orange' | 'green' | 'blue' | 'red';
  showValue?: boolean;
  className?: string;
  maxValue?: number; // For scaling the bar
  animated?: boolean;
  delay?: number; // Animation delay in seconds
}

const colorVariants = {
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
};

const backgroundVariants = {
  orange: 'bg-orange-500/10',
  green: 'bg-green-500/10',
  blue: 'bg-blue-500/10',
  red: 'bg-red-500/10',
};

export function ProgressBar({
  value,
  color = 'orange',
  showValue = true,
  className,
  maxValue = 100,
  animated = true,
  delay = 0,
}: ProgressBarProps) {
  // Calculate percentage width
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Progress bar container */}
      <div className="flex-1 relative">
        <div 
          className={cn(
            'h-2 rounded-full overflow-hidden',
            backgroundVariants[color]
          )}
        >
          {animated ? (
            <motion.div
              className={cn(
                'h-full rounded-full',
                colorVariants[color]
              )}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{
                duration: 0.8,
                delay,
                ease: 'easeOut',
              }}
            />
          ) : (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                colorVariants[color]
              )}
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>
      </div>

      {/* Value display */}
      {showValue && (
        <span className="font-mono text-sm text-muted-foreground min-w-[3.5rem] text-right">
          {value.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

// Compact version for table rows
export function CompactProgressBar({
  value,
  color = 'orange',
  maxValue = 20, // Default max for pick rates
  className,
}: {
  value: number;
  color?: 'orange' | 'green' | 'blue' | 'red';
  maxValue?: number;
  className?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div className={cn('relative h-1.5 rounded-full overflow-hidden', backgroundVariants[color], className)}>
      <motion.div
        className={cn('h-full rounded-full', colorVariants[color])}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
        }}
      />
    </div>
  );
}