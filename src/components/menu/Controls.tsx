import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "../../providers/ThemeProvider";

interface ControlsProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Controls = ({ collapsed, setCollapsed }: ControlsProps) => {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center justify-between p-3 border-b ${
      theme === "dark" ? "border-gray-800" : "border-gray-100"
    }`}>
      {!collapsed && (
        <div className={`text-[11px] font-medium tracking-[0.15em] ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}>
          ARBITRAGE-OS
        </div>
      )}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div 
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer text-gray-500 dark:text-gray-400"
        >
          {collapsed ? <ChevronRight className="h-5 w-5 " /> : <ChevronLeft className="h-5 w-5 " />}
        </div>
      </div>
    </div>
  );
};