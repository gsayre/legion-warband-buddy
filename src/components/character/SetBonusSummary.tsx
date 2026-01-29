import type { GearPiece } from "@/lib/character-constants"
import { countSetBonuses, SET_COLORS } from "@/lib/character-constants"
import { cn } from "@/lib/utils"

interface SetBonusSummaryProps {
  gear: GearPiece[]
  className?: string
}

export function SetBonusSummary({ gear, className }: SetBonusSummaryProps) {
  const setBonuses = countSetBonuses(gear)
  const entries = Object.entries(setBonuses).sort((a, b) => b[1] - a[1])

  if (entries.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No set bonuses
      </div>
    )
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {entries.map(([setName, count]) => {
        const color = SET_COLORS[setName] || "#888"
        const hasBonus = count >= 2

        return (
          <div
            key={setName}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm",
              hasBonus ? "font-semibold" : "opacity-70",
            )}
            style={{
              backgroundColor: `${color}20`,
              borderColor: color,
              borderWidth: 1,
              color: color,
            }}
          >
            <span>{setName}</span>
            <span
              className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs",
                hasBonus ? "bg-background/50" : "bg-background/30",
              )}
            >
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}
