import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../../providers/ThemeProvider";

interface ControlsProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Controls = ({ collapsed, setCollapsed }: ControlsProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`flex items-center justify-between p-3 border-b ${
        theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-100"
      }`}
    >
      {!collapsed && (
        <div
          className={`text-sm font-small uppercase tracking-wide ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          ARBITRAGE-OS
        </div>
      )}
      <div className="flex items-center gap-1">
        <ThemeToggle 
          theme={theme} 
          toggleTheme={toggleTheme} 
          className="h-6 w-6 flex items-center justify-center" 
        />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`h-6 w-6 flex items-center justify-center rounded-lg ${
            theme === "dark"
              ? "bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300"
              : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-600"
          } transition-colors`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
};