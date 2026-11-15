'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      className={`group/toggle relative inline-flex items-center h-8 w-[84px] sm:h-9 sm:w-[92px] rounded-full cursor-pointer select-none transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 shrink-0 ${
        isDark
          ? 'bg-[#0e131b]/85 border border-white/15 shadow-[inset_0_1px_2px_rgba(255,255,255,0.12),0_8px_22px_rgba(0,0,0,0.45)]'
          : 'bg-[#4f4338]/35 backdrop-blur-md border border-white/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_6px_18px_rgba(31,22,17,0.16)]'
      } ${className}`}
    >
      {/* Track label */}
      <span
        className={`w-full text-[12px] font-medium tracking-[-0.01em] transition-all duration-300 pointer-events-none ${
          isDark
            ? 'text-left pl-3.5 text-slate-300'
            : 'text-right pr-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]'
        }`}
      >
        {isDark ? 'Dark' : 'Light'}
      </span>

      {/* Liquid-glass overflowing lens knob */}
      <span
        aria-hidden="true"
        className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 sm:w-[42px] sm:h-[42px] rounded-full flex items-center justify-center backdrop-blur-lg transition-all duration-300 ease-[cubic-bezier(0.22,0.7,0.2,1)] ${
          isDark
            ? 'translate-x-[47px] sm:translate-x-[53px] bg-gradient-to-br from-white/15 via-[#18202c]/75 to-black/65 border border-white/25 shadow-[0_8px_22px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.28)]'
            : 'translate-x-[-3px] bg-gradient-to-br from-white/65 via-white/30 to-white/15 border border-white/75 shadow-[0_8px_20px_rgba(31,22,17,0.22),inset_0_1px_2px_rgba(255,255,255,0.9)]'
        }`}
      >
        {isDark ? (
          <Moon
            className="w-4 h-4 sm:w-[17px] sm:h-[17px] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]"
            strokeWidth={2}
            fill="currentColor"
          />
        ) : (
          <Sun
            className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]"
            strokeWidth={2.2}
          />
        )}
      </span>
    </button>
  );
}
