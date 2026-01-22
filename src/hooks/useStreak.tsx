import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

type StreakData = {
  current: number;
  lastActiveAt?: string; // ISO
};

type UseStreakReturn = {
  streak: number;
  lastActiveAt?: string;
  recordActivity: () => { increased: boolean; broken: boolean };
  resetStreak: () => void;
  lastChange?: 'increment' | 'reset' | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isSameLocalDate(a?: string, b?: string) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

export function useStreak(): UseStreakReturn {
  const [stored, setStored] = useLocalStorage<StreakData>('study-sync-streak', { current: 0 });
  const [lastChange, setLastChange] = useState<UseStreakReturn['lastChange']>(null);

  const recordActivity = useCallback(() => {
    const now = new Date();
    const nowIso = now.toISOString();

    const lastIso = stored.lastActiveAt;

    // Already active today -> no-op
    if (isSameLocalDate(lastIso, nowIso)) {
      setLastChange(null);
      return { increased: false, broken: false };
    }

    if (!lastIso) {
      const next: StreakData = { current: 1, lastActiveAt: nowIso };
      setStored(next);
      setLastChange('increment');
      return { increased: true, broken: false };
    }

    const lastDate = new Date(lastIso);
    const diff = now.getTime() - lastDate.getTime();

    if (diff <= DAY_MS) {
      // within 24 hours -> increment
      const next: StreakData = { current: stored.current + 1, lastActiveAt: nowIso };
      setStored(next);
      setLastChange('increment');
      return { increased: true, broken: false };
    }

    // gap >= 24 hours -> broken, reset to 1
    const next: StreakData = { current: 1, lastActiveAt: nowIso };
    setStored(next);
    setLastChange('reset');
    return { increased: true, broken: true };
  }, [stored, setStored]);

  const resetStreak = useCallback(() => {
    const next: StreakData = { current: 0 };
    setStored(next);
    setLastChange('reset');
  }, [setStored]);

  // clear transient lastChange after a short time so animations can trigger
  useEffect(() => {
    if (!lastChange) return;
    const t = setTimeout(() => setLastChange(null), 1800);
    return () => clearTimeout(t);
  }, [lastChange]);

  return {
    streak: stored.current || 0,
    lastActiveAt: stored.lastActiveAt,
    recordActivity,
    resetStreak,
    lastChange,
  };
}

export default useStreak;
