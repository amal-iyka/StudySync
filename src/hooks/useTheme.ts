import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface ThemePreference {
  mode: 'light' | 'dark';
  accent: string;
}

const ACCENT_COLORS = {
  blue: { primary: '217 91% 60%', accent: '262 83% 58%' },
  purple: { primary: '262 83% 58%', accent: '217 91% 60%' },
  green: { primary: '142 76% 36%', accent: '172 66% 50%' },
  orange: { primary: '25 95% 53%', accent: '38 92% 50%' },
  pink: { primary: '330 80% 60%', accent: '280 80% 60%' },
  teal: { primary: '172 66% 50%', accent: '199 89% 48%' },
};

function isValidThemePreference(value: unknown): value is ThemePreference {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    (obj.mode === 'light' || obj.mode === 'dark') &&
    typeof obj.accent === 'string'
  );
}

export function useTheme(userId: string | undefined) {
  const [theme, setTheme] = useState<ThemePreference>({ mode: 'light', accent: 'blue' });
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from profile or localStorage
  useEffect(() => {
    const loadTheme = async () => {
      // First check localStorage for immediate application
      const savedTheme = localStorage.getItem('studysync_theme');
      if (savedTheme) {
        try {
          const parsed = JSON.parse(savedTheme);
          if (isValidThemePreference(parsed)) {
            setTheme(parsed);
            applyTheme(parsed);
          }
        } catch (e) {
          console.error('Failed to parse saved theme');
        }
      }

      // Then fetch from database if user is logged in
      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', userId)
          .single();

        if (data?.theme_preference && isValidThemePreference(data.theme_preference)) {
          setTheme(data.theme_preference);
          applyTheme(data.theme_preference);
          localStorage.setItem('studysync_theme', JSON.stringify(data.theme_preference));
        }
      }

      setIsLoading(false);
    };

    loadTheme();
  }, [userId]);

  const applyTheme = (themePreference: ThemePreference) => {
    const root = document.documentElement;
    
    // Apply dark/light mode
    if (themePreference.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply accent color
    const colors = ACCENT_COLORS[themePreference.accent as keyof typeof ACCENT_COLORS] || ACCENT_COLORS.blue;
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--ring', colors.primary);
    root.style.setProperty('--sidebar-primary', colors.primary);
    root.style.setProperty('--chart-1', colors.primary);
    root.style.setProperty('--chart-2', colors.accent);
  };

  const setThemeMode = async (mode: 'light' | 'dark') => {
    const newTheme = { ...theme, mode };
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('studysync_theme', JSON.stringify(newTheme));

    if (userId) {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme as unknown as Json })
        .eq('id', userId);
    }
  };

  const setAccentColor = async (accent: string) => {
    const newTheme = { ...theme, accent };
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('studysync_theme', JSON.stringify(newTheme));

    if (userId) {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme as unknown as Json })
        .eq('id', userId);
    }
  };

  const toggleMode = () => {
    setThemeMode(theme.mode === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    isLoading,
    setThemeMode,
    setAccentColor,
    toggleMode,
    accentColors: Object.keys(ACCENT_COLORS)
  };
}
