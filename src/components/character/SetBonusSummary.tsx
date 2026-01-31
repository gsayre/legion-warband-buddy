import type { ClassName, GearPiece, Slot } from "@/lib/character-constants"
import type { GearSet, SetBonus, StatBonusEntry } from "@/lib/sets-constants"
import { cn } from "@/lib/utils"

// Purple color for epic/set items
const SET_COLOR = "var(--quality-epic)"

interface SetBonusSummaryProps {
  gear: GearPiece[]
  sets: GearSet[] | undefined
  characterClass: ClassName
  className?: string
}

// Summary data for a single set
interface SetSummaryItem {
  setName: string
  quality: string
  equippedCount: number
  totalPieces: number
  pieces: { slot: string; name: string; equipped: boolean }[]
  bonuses: {
    piecesRequired: number
    active: boolean
    stats: { stat: string; value: number }[]
    specialBonus?: string
  }[]
  // If true, this set wasn't found in the database
  fallback: boolean
}

// Filter stat bonuses by character class
function filterStatsForClass(
  stats: StatBonusEntry[] | undefined,
  characterClass: ClassName,
): { stat: string; value: number }[] {
  if (!stats) return []

  return stats
    .filter(
      (s) =>
        !s.forClasses ||
        s.forClasses.length === 0 ||
        s.forClasses.includes(characterClass),
    )
    .map((s) => ({ stat: s.stat, value: s.value }))
}

// Build summary data from gear and database sets
function buildSetSummaryData(
  gear: GearPiece[],
  sets: GearSet[],
  characterClass: ClassName,
): SetSummaryItem[] {
  // Group gear by set name
  const gearBySet = new Map<string, GearPiece[]>()
  for (const piece of gear) {
    if (piece.setBonus) {
      const existing = gearBySet.get(piece.setBonus) || []
      existing.push(piece)
      gearBySet.set(piece.setBonus, existing)
    }
  }

  const summaries: SetSummaryItem[] = []

  for (const [setName, equippedPieces] of gearBySet) {
    // Find matching set in database
    const dbSet = sets.find((s) => s.name === setName)

    if (dbSet) {
      // Build pieces list from database set
      const equippedSlots = new Set(equippedPieces.map((p) => p.slot))
      const pieces = dbSet.pieces.map((p) => ({
        slot: p.slot,
        name: p.name,
        equipped: equippedSlots.has(p.slot as Slot),
      }))

      // Build bonuses with active status
      const bonuses = dbSet.bonuses.map((b: SetBonus) => ({
        piecesRequired: b.pieces,
        active: equippedPieces.length >= b.pieces,
        stats: filterStatsForClass(b.stats, characterClass),
        specialBonus: b.specialBonus,
      }))

      summaries.push({
        setName,
        quality: dbSet.quality,
        equippedCount: equippedPieces.length,
        totalPieces: dbSet.pieces.length,
        pieces,
        bonuses,
        fallback: false,
      })
    } else {
      // Fallback for sets not in database
      summaries.push({
        setName,
        quality: "epic",
        equippedCount: equippedPieces.length,
        totalPieces: equippedPieces.length,
        pieces: equippedPieces.map((p) => ({
          slot: p.slot,
          name: p.itemName || p.slot,
          equipped: true,
        })),
        bonuses: [],
        fallback: true,
      })
    }
  }

  // Sort by equipped count descending
  return summaries.sort((a, b) => b.equippedCount - a.equippedCount)
}

// Format stats as a readable string
function formatStats(stats: { stat: string; value: number }[]): string {
  return stats.map((s) => `+${s.value} ${s.stat}`).join(", ")
}

export function SetBonusSummary({
  gear,
  sets,
  characterClass,
  className,
}: SetBonusSummaryProps) {
  // Loading state
  if (sets === undefined) {
    return (
      <div className={cn("text-muted-foreground", className)}>Loading...</div>
    )
  }

  const summaries = buildSetSummaryData(gear, sets, characterClass)

  // Empty state
  if (summaries.length === 0) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        No set bonuses
      </div>
    )
  }

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {summaries.map((summary) => (
        <div key={summary.setName} className="space-y-1">
          <h4
            className="font-semibold break-words text-sm sm:text-base"
            style={{ color: SET_COLOR }}
          >
            {summary.setName} ({summary.equippedCount}/{summary.totalPieces}):
          </h4>

          {/* Piece list */}
          <ul className="space-y-0.5 pl-2">
            {summary.pieces.map(({ slot, name, equipped }) => (
              <li
                key={slot}
                className={cn(
                  "flex items-center gap-1 flex-wrap text-xs sm:text-sm",
                  equipped ? "set-piece-equipped" : "text-muted-foreground/50",
                )}
                style={equipped ? { color: SET_COLOR } : undefined}
              >
                <span className="text-muted-foreground/50">-</span>
                <span>{slot}</span>
                {name !== slot && (
                  <span className="text-muted-foreground/70 text-xs">
                    ({name})
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Bonuses */}
          {summary.bonuses.length > 0 && (
            <ul className="space-y-0.5 pl-2 pt-1">
              {summary.bonuses.map((bonus) => (
                <li
                  key={bonus.piecesRequired}
                  className={cn(
                    "text-xs sm:text-sm break-words",
                    bonus.active
                      ? "text-green-500"
                      : "text-muted-foreground/50",
                  )}
                >
                  <span className="font-medium">
                    ({bonus.piecesRequired}) Set:
                  </span>{" "}
                  {bonus.stats.length > 0 && formatStats(bonus.stats)}
                  {bonus.stats.length > 0 && bonus.specialBonus && " + "}
                  {bonus.specialBonus && (
                    <span className="italic">{bonus.specialBonus}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Fallback notice */}
          {summary.fallback && (
            <p className="text-xs text-muted-foreground/50 pl-2 italic">
              Set details not in database
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
