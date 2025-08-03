// components/menu/Controls.tsx
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
      className={`flex items-center justify-between p-4 border-b ${
        theme === "dark" ? "border-gray-800" : "border-gray-100"
      }`}
    >
      {!collapsed && (
        <div
          className={`text-xs font-medium uppercase tracking-wide ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Navigation
        </div>
      )}
      <div className="flex items-center gap-2">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-lg ${
            theme === "dark"
              ? "text-gray-400 hover:bg-gray-800 hover:text-gray-300"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-600"
          } transition-colors`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};