import { ChevronLeft, ChevronRight } from "lucide-react";

interface ControlsProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Controls = ({ collapsed, setCollapsed }: ControlsProps) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-800">
      {!collapsed && (
        <div className="text-[11px] font-medium tracking-[0.15em] text-gray-400">
          ARBITRAGE-OS
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="cursor-pointer text-gray-400 hover:text-gray-300"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </div>
      </div>
    </div>
  );
};