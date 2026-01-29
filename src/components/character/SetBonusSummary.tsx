import type { GearPiece, Slot } from "@/lib/character-constants"
import { cn } from "@/lib/utils"

// Purple color for epic/set items
const SET_COLOR = "var(--quality-epic)"

interface SetBonusSummaryProps {
  gear: GearPiece[]
  className?: string
}

// Standard set piece slots (typical tier set slots)
const SET_SLOTS: Slot[] = ["Head", "Shoulders", "Chest", "Gloves", "Pants"]
const TOTAL_SET_PIECES = SET_SLOTS.length

// Get all unique set names from gear and group pieces by set
function getSetBonusData(gear: GearPiece[]) {
  const setMap = new Map<string, { slot: Slot; equipped: boolean }[]>()

  // First, find all unique set names
  const setNames = new Set<string>()
  for (const piece of gear) {
    if (piece.setBonus) {
      setNames.add(piece.setBonus)
    }
  }

  // For each set, create the list of slots with equipped status
  for (const setName of setNames) {
    const pieces = SET_SLOTS.map((slot) => {
      const gearPiece = gear.find((g) => g.slot === slot)
      const isEquipped = gearPiece?.setBonus === setName
      return { slot, equipped: isEquipped }
    })
    setMap.set(setName, pieces)
  }

  return setMap
}

export function SetBonusSummary({ gear, className }: SetBonusSummaryProps) {
  const setData = getSetBonusData(gear)
  const entries = Array.from(setData.entries()).sort((a, b) => {
    // Sort by number of equipped pieces (descending)
    const aCount = a[1].filter((p) => p.equipped).length
    const bCount = b[1].filter((p) => p.equipped).length
    return bCount - aCount
  })

  if (entries.length === 0) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        No set bonuses
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {entries.map(([setName, pieces]) => {
        const equippedCount = pieces.filter((p) => p.equipped).length

        return (
          <div key={setName} className="space-y-1">
            <h4
              className="font-semibold"
              style={{ color: SET_COLOR }}
            >
              {setName} ({equippedCount}/{TOTAL_SET_PIECES}):
            </h4>
            <ul className="space-y-0.5 pl-2">
              {pieces.map(({ slot, equipped }) => (
                <li
                  key={slot}
                  className={cn(
                    "flex items-center gap-1",
                    equipped ? "set-piece-equipped" : "text-muted-foreground/50",
                  )}
                  style={equipped ? { color: SET_COLOR } : undefined}
                >
                  <span className="text-muted-foreground/50">-</span>
                  <span>{slot}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
