import type { GearPiece, Slot } from "@/lib/character-constants"
import { cn } from "@/lib/utils"
import { GearSlot } from "./GearSlot"

interface GearGridUShapedProps {
  gear: GearPiece[]
  className?: string
}

// Grid position mapping for U-shaped layout
// Col:  1        2      3      4       5
// R1:  Head     [ ]    [ ]    [ ]    Belt (display as "Waist")
// R2:  Neck     [ ]    [ ]    [ ]    Pants
// R3:  Shld     [ ]    [ ]    [ ]    Boots
// R4:  Chest    [ ]    [ ]    [ ]    Ring1
// R5:  Back     [ ]    [ ]    [ ]    Ring2
// R6:  Wrist    [ ]    [ ]    [ ]    Trnk1
// R7:  Glove    MH     [ ]    OH     Trnk2
const SLOT_POSITIONS: Record<Slot, { row: number; col: number }> = {
  Head: { row: 1, col: 1 },
  Belt: { row: 1, col: 5 },
  Neck: { row: 2, col: 1 },
  Pants: { row: 2, col: 5 },
  Shoulders: { row: 3, col: 1 },
  Boots: { row: 3, col: 5 },
  Chest: { row: 4, col: 1 },
  "Ring 1": { row: 4, col: 5 },
  Back: { row: 5, col: 1 },
  "Ring 2": { row: 5, col: 5 },
  Wrist: { row: 6, col: 1 },
  "Trinket 1": { row: 6, col: 5 },
  Gloves: { row: 7, col: 1 },
  "Main Hand": { row: 7, col: 2 },
  "Off Hand": { row: 7, col: 4 },
  "Trinket 2": { row: 7, col: 5 },
}

// Display labels - Belt shown as "Waist" per spec
const DISPLAY_LABELS: Partial<Record<Slot, string>> = {
  Belt: "Waist",
}

function getGearBySlot(gear: GearPiece[], slot: Slot): GearPiece {
  return gear.find((g) => g.slot === slot) || { slot }
}

export function GearGridUShaped({
  gear,
  className,
}: GearGridUShapedProps) {
  // Check if Main Hand is two-handed
  const mainHandGear = gear.find((g) => g.slot === "Main Hand")
  const isMainHandTwoHanded = mainHandGear?.twoHanded ?? false

  return (
    <div
      className={cn(
        "grid justify-items-center",
        "grid-cols-[repeat(5,2.75rem)] grid-rows-[repeat(7,auto)]",
        "gap-1.5 p-2",
        "sm:grid-cols-[repeat(5,3.25rem)] sm:gap-2 sm:p-3",
        "md:grid-cols-[repeat(5,4rem)] md:gap-2.5 md:p-4",
        "lg:grid-cols-[repeat(5,4.5rem)] lg:gap-3 lg:p-4",
        className,
      )}
    >
      {Object.entries(SLOT_POSITIONS).map(([slot, position]) => {
        const gearPiece = getGearBySlot(gear, slot as Slot)
        const displayLabel = DISPLAY_LABELS[slot as Slot]
        const isDisabled = slot === "Off Hand" && isMainHandTwoHanded

        return (
          <div
            key={slot}
            style={{
              gridRow: position.row,
              gridColumn: position.col,
            }}
          >
            <GearSlot
              gear={gearPiece}
              displayLabel={displayLabel}
              disabled={isDisabled}
            />
          </div>
        )
      })}
    </div>
  )
}
