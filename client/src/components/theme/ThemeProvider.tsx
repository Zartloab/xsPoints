import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'violet' | 'blue' | 'green' | 'orange' | 'rose' | 'amber';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize from local storage if available, otherwise default to system preference
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('xpoints-theme');
    return (savedTheme as Theme) || 'system';
  });
  
  // Initialize accent color from local storage if available
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const savedColor = localStorage.getItem('xpoints-accent-color');
    return (savedColor as AccentColor) || 'violet';
  });

  // Check for system preference
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Update the actual DOM when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    // Determine which theme to apply
    const themeToApply = theme === 'system' ? systemTheme : theme;
    
    // Add the appropriate theme class
    root.classList.add(themeToApply);
    
    // Store in local storage
    localStorage.setItem('xpoints-theme', theme);
  }, [theme, systemTheme]);

  // Apply accent color
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove all accent color classes
    root.classList.remove(
      'accent-violet',
      'accent-blue',
      'accent-green',
      'accent-orange',
      'accent-rose',
      'accent-amber'
    );
    
    // Add selected accent color
    root.classList.add(`accent-${accentColor}`);
    
    // Store in local storage
    localStorage.setItem('xpoints-accent-color', accentColor);
  }, [accentColor]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial value
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Listen for changes
    const handler = (evt: MediaQueryListEvent) => {
      setSystemTheme(evt.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  // Handle automatic time-based switching
  useEffect(() => {
    // Only run if theme is set to system
    if (theme !== 'system') return;
    
    const checkTime = () => {
      const currentHour = new Date().getHours();
      // Dark mode between 8 PM and 7 AM
      const shouldBeDark = currentHour >= 20 || currentHour < 7;
      setSystemTheme(shouldBeDark ? 'dark' : 'light');
    };
    
    // Check immediately
    checkTime();
    
    // Check every hour
    const interval = setInterval(checkTime, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setThemeState('dark');
    } else if (theme === 'dark') {
      setThemeState('system');
    } else {
      setThemeState('light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;