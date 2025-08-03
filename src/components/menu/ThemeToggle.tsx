"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import { useTheme } from "../../providers/ThemeProvider";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div 
      onClick={toggleTheme}
      className="cursor-pointer text-gray-500 dark:text-gray-400"
    >
      {theme === "dark" ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </div>
  );
};