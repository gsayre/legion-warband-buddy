import type { ClassName, GearPiece } from "@/lib/character-constants"
import {
  calculateAverageIlvl,
  getLegendaries,
  isStatCapped,
} from "@/lib/character-constants"
import { cn } from "@/lib/utils"
import { SetBonusSummary } from "./SetBonusSummary"

interface StatSheetProps {
  className: ClassName
  gear: GearPiece[]
  hitPercent: number
  expertisePercent: number
  onEditStats?: () => void
  containerClassName?: string
}

export function StatSheet({
  className,
  gear,
  hitPercent,
  expertisePercent,
  onEditStats,
  containerClassName,
}: StatSheetProps) {
  const avgIlvl = calculateAverageIlvl(gear)
  const legendaries = getLegendaries(gear)
  const hitCapped = isStatCapped("hit", hitPercent)
  const expertiseCapped = isStatCapped("expertise", expertisePercent)

  return (
    <div className={cn("space-y-4", containerClassName)}>
      {/* Class Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{className}</h2>
        <div className="text-3xl font-bold text-primary">
          {avgIlvl > 0 ? avgIlvl.toFixed(1) : "-"}
          <span className="text-lg text-muted-foreground ml-1">ilvl</span>
        </div>
      </div>

      {/* Hit & Expertise */}
      <button
        type="button"
        className={cn(
          "bg-muted rounded-lg p-4 space-y-2 w-full text-left",
          onEditStats && "cursor-pointer hover:bg-muted/80",
        )}
        onClick={onEditStats}
        disabled={!onEditStats}
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase">
          Combat Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Hit</div>
            <div
              className={cn(
                "text-xl font-bold",
                hitCapped ? "text-green-500 font-semibold" : "text-yellow-500",
              )}
            >
              {hitPercent.toFixed(1)}%
              {hitCapped && (
                <span className="text-xs ml-1 opacity-80">(CAP)</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Expertise</div>
            <div
              className={cn(
                "text-xl font-bold",
                expertiseCapped
                  ? "text-green-500 font-semibold"
                  : "text-yellow-500",
              )}
            >
              {expertisePercent.toFixed(1)}%
              {expertiseCapped && (
                <span className="text-xs ml-1 opacity-80">(CAP)</span>
              )}
            </div>
          </div>
        </div>
        {onEditStats && (
          <div className="text-xs text-muted-foreground text-center mt-2">
            Click to edit
          </div>
        )}
      </button>

      {/* Set Bonuses */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
          Set Bonuses
        </h3>
        <SetBonusSummary gear={gear} />
      </div>

      {/* Legendaries */}
      {legendaries.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
            Legendaries
          </h3>
          <div className="space-y-1">
            {legendaries.map((item) => (
              <div
                key={`${item.slot}-${item.legendary}`}
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--quality-legendary)" }}
              >
                <span className="font-semibold">{item.legendary}</span>
                <span className="text-muted-foreground">({item.slot})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gear Summary */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
          Gear Summary
        </h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Equipped Slots</span>
            <span>{gear.filter((g) => g.ilvl && g.ilvl > 0).length}/16</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Legendaries</span>
            <span style={{ color: "var(--quality-legendary)" }}>
              {legendaries.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
