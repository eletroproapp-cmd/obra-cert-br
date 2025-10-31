import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewModeToggleProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export const ViewModeToggle = ({ viewMode, onViewModeChange }: ViewModeToggleProps) => {
  return (
    <div className="flex items-center gap-1 border rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange("grid")}
        className={cn(
          "px-2 sm:px-3 h-9 sm:h-8",
          viewMode === "grid" && "bg-primary/10 text-primary"
        )}
      >
        <LayoutGrid className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange("list")}
        className={cn(
          "px-2 sm:px-3 h-9 sm:h-8",
          viewMode === "list" && "bg-primary/10 text-primary"
        )}
      >
        <List className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
    </div>
  );
};
