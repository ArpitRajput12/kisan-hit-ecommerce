import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className={`p-2 rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-agri-green-700 dark:hover:text-emerald-400 hover:border-agri-green-300 dark:hover:border-emerald-700 shadow-sm active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-agri-harvest-400 animate-spin-slow" />
      ) : (
        <Moon className="w-5 h-5 text-agri-green-900" />
      )}
    </button>
  );
};

