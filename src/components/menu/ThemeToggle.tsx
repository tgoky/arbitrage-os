"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";

interface ThemeToggleProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  className?: string;
}

export const ThemeToggle = ({
  theme,
  toggleTheme,
  className = "",
}: ThemeToggleProps) => {
  return (
    <button
      onClick={toggleTheme}
      className={`p-1 rounded-lg ${className} ${
        theme === "dark"
          ? "bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
          : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-600"
      }`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "dark" ? (
        <SunIcon className="h-4 w-4 text-yellow-300" />
      ) : (
        <MoonIcon className="h-4 w-4 text-gray-700" />
      )}
    </button>
  );
};