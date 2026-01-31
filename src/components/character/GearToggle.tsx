import { cn } from "@/lib/utils"

export type GearMode = "adventure" | "dungeon"

interface GearToggleProps {
  mode: GearMode
  onChange: (mode: GearMode) => void
  className?: string
}

export function GearToggle({ mode, onChange, className }: GearToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex w-full sm:w-auto rounded-lg border bg-muted p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange("adventure")}
        className={cn(
          "flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors",
          mode === "adventure"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Adventure
      </button>
      <button
        type="button"
        onClick={() => onChange("dungeon")}
        className={cn(
          "flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors",
          mode === "dungeon"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Dungeon
      </button>
    </div>
  )
}
