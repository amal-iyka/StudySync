import React from 'react';
import clsx from 'clsx';
import useStreak from '@/hooks/useStreak';

export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const { streak, lastChange } = useStreak();

  return (
    <div className="flex items-center gap-3">
      <div
        className={clsx(
          'w-12 h-12 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-yellow-400/10 to-yellow-400/6',
          lastChange === 'increment' ? 'animate-bounce' : 'transition-transform'
        )}
        aria-hidden
      >
        <div className={clsx('text-yellow-500 text-xl', lastChange === 'increment' && 'scale-110')}>
          🔥
        </div>
      </div>

      <div className="text-left">
        <div className="text-xs text-muted-foreground">Streak</div>
        <div className="font-semibold text-sm">
          {streak} {streak === 1 ? 'day' : 'days'}
        </div>
      </div>
    </div>
  );
}

export default StreakBadge;
