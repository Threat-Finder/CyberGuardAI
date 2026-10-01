import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
  variant?: 'pill' | 'icon' | 'sidebar';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDarkMode,
  onToggle,
  variant = 'pill',
}) => {
  if (variant === 'icon') {
    return (
      <button
        onClick={onToggle}
        className="p-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] text-[var(--accent-purple)] hover:border-[var(--accent-purple)] transition-all cursor-pointer shadow-sm"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle Dark and Light theme"
      >
        {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#7C3AED]" />}
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--subtle-bg)] border border-[var(--panel-border)] text-[var(--text-body)] hover:text-[var(--text-heading)] hover:border-[var(--accent-purple)] transition-all cursor-pointer"
        title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      >
        <div className="flex items-center gap-2">
          {isDarkMode ? (
            <Moon className="w-3.5 h-3.5 text-[#B794F6]" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
        </div>
        <div className="w-7 h-4 rounded-full bg-[var(--panel-border)] relative p-0.5 transition-colors">
          <div
            className={`w-3 h-3 rounded-full bg-[var(--accent-purple)] shadow-sm transform transition-transform duration-200 ${
              isDarkMode ? 'translate-x-3' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    );
  }

  // Default 'pill' variant for TopNavbar
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-[var(--accent-purple)] transition-all cursor-pointer group shadow-sm text-xs font-semibold text-[var(--text-body)] hover:text-[var(--text-heading)]"
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-[#7C3AED] group-hover:-rotate-12 transition-transform" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
      <span className="w-6 h-3.5 rounded-full bg-[var(--subtle-bg)] border border-[var(--panel-border)] relative p-0.5 flex items-center">
        <span
          className={`w-2.5 h-2.5 rounded-full bg-[var(--accent-purple)] transition-transform duration-200 ${
            isDarkMode ? 'translate-x-2.5' : 'translate-x-0'
          }`}
        />
      </span>
    </button>
  );
};
