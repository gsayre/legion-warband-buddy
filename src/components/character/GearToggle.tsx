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
      className={cn("inline-flex rounded-lg border bg-muted p-1", className)}
    >
      <button
        type="button"
        onClick={() => onChange("adventure")}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md transition-colors",
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
          "px-4 py-2 text-sm font-medium rounded-md transition-colors",
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
