// components/ThemeToggle.tsx
"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

export const ThemeToggle = ({ 
  theme, 
  toggleTheme 
}: { 
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}) => {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5 text-yellow-300" />
      ) : (
        <MoonIcon className="h-5 w-5 text-gray-700" />
      )}
    </button>
  );
};