import type { GearPiece, Slot } from "@/lib/character-constants"
import { cn } from "@/lib/utils"
import { GearSlot } from "./GearSlot"

interface GearLayoutProps {
  gear: GearPiece[]
  onSlotClick?: (slot: Slot) => void
  className?: string
}

// Get gear piece by slot from array
function getGearBySlot(gear: GearPiece[], slot: Slot): GearPiece {
  return gear.find((g) => g.slot === slot) || { slot }
}

export function GearLayout({ gear, onSlotClick, className }: GearLayoutProps) {
  const handleClick = (slot: Slot) => {
    onSlotClick?.(slot)
  }

  // Check if Main Hand is two-handed
  const mainHandGear = gear.find((g) => g.slot === "Main Hand")
  const isMainHandTwoHanded = mainHandGear?.twoHanded ?? false

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Row 1: Head */}
      <div className="flex justify-center">
        <GearSlot
          gear={getGearBySlot(gear, "Head")}
          onClick={() => handleClick("Head")}
        />
      </div>

      {/* Row 2: Shoulders, Neck */}
      <div className="flex gap-8">
        <GearSlot
          gear={getGearBySlot(gear, "Shoulders")}
          onClick={() => handleClick("Shoulders")}
        />
        <GearSlot
          gear={getGearBySlot(gear, "Neck")}
          onClick={() => handleClick("Neck")}
        />
      </div>

      {/* Row 3: Chest, Back */}
      <div className="flex gap-8">
        <GearSlot
          gear={getGearBySlot(gear, "Chest")}
          onClick={() => handleClick("Chest")}
        />
        <GearSlot
          gear={getGearBySlot(gear, "Back")}
          onClick={() => handleClick("Back")}
        />
      </div>

      {/* Row 4: Wrist, Main Hand */}
      <div className="flex gap-8">
        <GearSlot
          gear={getGearBySlot(gear, "Wrist")}
          onClick={() => handleClick("Wrist")}
        />
        <GearSlot
          gear={getGearBySlot(gear, "Main Hand")}
          onClick={() => handleClick("Main Hand")}
        />
      </div>

      {/* Row 5: Gloves, Off Hand */}
      <div className="flex gap-8">
        <GearSlot
          gear={getGearBySlot(gear, "Gloves")}
          onClick={() => handleClick("Gloves")}
        />
        <GearSlot
          gear={getGearBySlot(gear, "Off Hand")}
          onClick={() => handleClick("Off Hand")}
          disabled={isMainHandTwoHanded}
        />
      </div>

      {/* Row 6: Belt */}
      <div className="flex justify-center">
        <GearSlot
          gear={getGearBySlot(gear, "Belt")}
          onClick={() => handleClick("Belt")}
        />
      </div>

      {/* Row 7: Pants */}
      <div className="flex justify-center">
        <GearSlot
          gear={getGearBySlot(gear, "Pants")}
          onClick={() => handleClick("Pants")}
        />
      </div>

      {/* Row 8: Boots */}
      <div className="flex justify-center">
        <GearSlot
          gear={getGearBySlot(gear, "Boots")}
          onClick={() => handleClick("Boots")}
        />
      </div>

      {/* Row 9: Rings and Trinkets */}
      <div className="flex gap-2 mt-2">
        <GearSlot
          gear={getGearBySlot(gear, "Ring 1")}
          onClick={() => handleClick("Ring 1")}
        />
        <GearSlot
          gear={getGearBySlot(gear, "Ring 2")}
          onClick={() => handleClick("Ring 2")}
        />
        <GearSlot
          gear={getGearBySlot(gear, "Trinket 1")}
          onClick={() => handleClick("Trinket 1")}
        />
        <GearSlot
          gear={getGearBySlot(gear, "Trinket 2")}
          onClick={() => handleClick("Trinket 2")}
        />
      </div>
    </div>
  )
}
