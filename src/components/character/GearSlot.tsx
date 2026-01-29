import type { GearPiece, Quality, Slot } from "@/lib/character-constants"
import { getQualityFromIlvl, SET_COLORS } from "@/lib/character-constants"
import { cn } from "@/lib/utils"

interface GearSlotProps {
  gear: GearPiece
  onClick?: () => void
  className?: string
  displayLabel?: string
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

// Quality styles with border and background colors
const QUALITY_STYLES: Record<
  Quality,
  { borderColor: string; bgColor: string }
> = {
  common: {
    borderColor: "var(--quality-common)",
    bgColor: "rgba(156, 163, 175, 0.1)",
  },
  uncommon: {
    borderColor: "var(--quality-uncommon)",
    bgColor: "rgba(34, 197, 94, 0.1)",
  },
  rare: {
    borderColor: "var(--quality-rare)",
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  epic: {
    borderColor: "var(--quality-epic)",
    bgColor: "rgba(168, 85, 247, 0.1)",
  },
  legendary: {
    borderColor: "var(--quality-legendary)",
    bgColor: "rgba(249, 115, 22, 0.1)",
  },
}

export function GearSlot({
  gear,
  onClick,
  className,
  displayLabel,
}: GearSlotProps) {
  const hasItem = gear.ilvl !== undefined && gear.ilvl > 0
  const quality = gear.quality || getQualityFromIlvl(gear.ilvl)
  const isLegendary = Boolean(gear.legendary)

  const qualityStyle = hasItem ? QUALITY_STYLES[quality] : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-lg border-2 p-4 transition-all duration-200 hover:scale-105 cursor-pointer min-w-[100px] min-h-[100px]",
        !hasItem && "border-dashed border-muted-foreground/30 bg-muted/20",
        isLegendary && "animate-legendary-glow",
        className,
      )}
      style={
        qualityStyle
          ? {
              borderColor: qualityStyle.borderColor,
              backgroundColor: qualityStyle.bgColor,
            }
          : undefined
      }
      title={hasItem ? `${gear.slot} - ilvl ${gear.ilvl}` : gear.slot}
    >
      {/* Slot label */}
      <div className="text-xs text-center text-muted-foreground">
        {displayLabel || SLOT_LABELS[gear.slot]}
      </div>

      {/* Item level badge */}
      {hasItem && (
        <div
          className="absolute -top-1 -right-1 text-xs font-bold rounded-full px-1.5 py-0.5 bg-background border shadow-sm min-w-[24px] text-center"
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
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-semibold rounded px-1 py-0.5 whitespace-nowrap bg-background/90 backdrop-blur-sm"
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
