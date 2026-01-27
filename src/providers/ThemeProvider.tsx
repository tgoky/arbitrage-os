// app/providers/ThemeProvider.tsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Force dark theme - no light mode
  const [theme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Always set dark theme on mount, overriding any saved preference
    localStorage.setItem("theme", "dark");
    document.documentElement.className = "dark";
  }, []);

  // No-op toggle function (kept for compatibility if anything calls it)
  const toggleTheme = () => {
    // Theme switching disabled - app is dark-only
  };

  

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ConfigProvider
        theme={{
          algorithm:
            theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: theme === "dark" ? "#a78bfa" : "#6d28d9",
            colorText: theme === "dark" ? "#e5e7eb" : "#000000",
            colorBgBase: theme === "dark" ? "#000000" : "#ffffff",
          },
        }}
      >
        <div className={theme}>
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};


export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};