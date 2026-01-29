import type { GearPiece, Quality, Slot } from "@/lib/character-constants"
import { getQualityFromIlvl, SET_COLORS } from "@/lib/character-constants"
import { cn } from "@/lib/utils"

interface GearSlotProps {
  gear: GearPiece
  onClick?: () => void
  className?: string
}

// Short labels for slots
const SLOT_LABELS: Record<Slot, string> = {
  Head: "Head",
  Neck: "Neck",
  Shoulders: "Shld",
  Chest: "Chest",
  Back: "Back",
  Wrist: "Wrist",
  Gloves: "Gloves",
  "Main Hand": "MH",
  "Off Hand": "OH",
  Belt: "Belt",
  Pants: "Pants",
  Boots: "Boots",
  "Ring 1": "Ring",
  "Ring 2": "Ring",
  "Trinket 1": "Trink",
  "Trinket 2": "Trink",
}

function getQualityClass(quality: Quality): string {
  return `gear-quality-${quality}`
}

export function GearSlot({ gear, onClick, className }: GearSlotProps) {
  const hasItem = gear.ilvl !== undefined && gear.ilvl > 0
  const quality = gear.quality || getQualityFromIlvl(gear.ilvl)
  const isLegendary = Boolean(gear.legendary)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "gear-slot",
        hasItem ? getQualityClass(quality) : "gear-slot-empty",
        isLegendary && "legendary-glow",
        className,
      )}
      title={hasItem ? `${gear.slot} - ilvl ${gear.ilvl}` : gear.slot}
    >
      {/* Slot label */}
      <div className="text-xs text-center text-muted-foreground">
        {SLOT_LABELS[gear.slot]}
      </div>

      {/* Item level badge */}
      {hasItem && (
        <div
          className="ilvl-badge"
          style={{
            borderColor:
              quality === "legendary"
                ? "var(--quality-legendary)"
                : quality === "epic"
                  ? "var(--quality-epic)"
                  : quality === "rare"
                    ? "var(--quality-rare)"
                    : undefined,
          }}
        >
          {gear.ilvl}
        </div>
      )}

      {/* Set bonus indicator */}
      {gear.setBonus && (
        <div
          className="set-bonus-indicator"
          style={{
            color: SET_COLORS[gear.setBonus] || "inherit",
            borderColor: SET_COLORS[gear.setBonus] || "currentColor",
            borderWidth: 1,
          }}
        >
          {gear.setBonus.substring(0, 3)}
        </div>
      )}

      {/* Legendary indicator */}
      {isLegendary && (
        <div className="absolute top-0 left-0 text-[10px] text-orange-500 font-bold">
          L
        </div>
      )}
    </button>
  )
}
