import type { GearPiece, Quality, Slot } from "@/lib/character-constants"
import { SET_COLORS } from "@/lib/character-constants"
import { cn } from "@/lib/utils"

interface GearSlotProps {
  gear: GearPiece
  onClick?: () => void
  className?: string
  displayLabel?: string
  disabled?: boolean
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
  disabled,
}: GearSlotProps) {
  const hasItem = gear.ilvl !== undefined && gear.ilvl > 0
  const quality = gear.quality
  const isLegendary = Boolean(gear.legendary)

  const qualityStyle = hasItem && quality ? QUALITY_STYLES[quality] : null

  const Component = onClick ? "button" : "div"

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative border-2 transition-all duration-200",
        "rounded p-0.5 w-[2.75rem] h-[2.75rem]",
        "sm:w-[3.25rem] sm:h-[3.25rem] sm:p-1",
        "md:w-[4rem] md:h-[4rem] md:p-1.5",
        "lg:rounded-lg lg:w-[4.5rem] lg:h-[4.5rem] lg:p-1.5",
        !hasItem && "border-dashed border-muted-foreground/30 bg-muted/20",
        isLegendary && "animate-legendary-glow",
        disabled && "opacity-40 cursor-not-allowed",
        onClick && !disabled && "cursor-pointer hover:scale-105",
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
      title={
        disabled
          ? "Disabled (Main Hand is Two-Handed)"
          : hasItem
            ? `${gear.slot} - ilvl ${gear.ilvl}`
            : gear.slot
      }
    >
      {/* Slot label */}
      <div className="text-[10px] sm:text-xs text-center text-muted-foreground">
        {displayLabel || SLOT_LABELS[gear.slot]}
      </div>

      {/* Item level badge */}
      {hasItem && (
        <div
          className="absolute -top-1 -right-1 text-[10px] sm:text-xs font-bold rounded-full px-1.5 py-0.5 bg-background border shadow-sm min-w-[20px] sm:min-w-[24px] text-center"
          style={{
            borderColor: quality ? `var(--quality-${quality})` : undefined,
          }}
        >
          {gear.ilvl}
        </div>
      )}

      {/* Set bonus indicator */}
      {gear.setBonus && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] font-semibold rounded px-1 py-0.5 whitespace-nowrap bg-background/90 backdrop-blur-sm"
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
        <div className="absolute top-0 left-0 text-[8px] sm:text-[10px] text-orange-500 font-bold">
          L
        </div>
      )}
    </Component>
  )
}
