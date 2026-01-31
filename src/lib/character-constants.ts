// Character classes
export const CLASSES = [
  "Warrior",
  "Rogue",
  "Priest",
  "Mage",
  "Hunter",
  "Paladin",
] as const

export type ClassName = (typeof CLASSES)[number]

// Class colors
export const CLASS_COLORS: Record<ClassName, string> = {
  Warrior: "#f97316", // orange
  Rogue: "#eab308", // yellow
  Priest: "#ffffff", // white
  Mage: "#3b82f6", // blue
  Hunter: "#22c55e", // green
  Paladin: "#ec4899", // pink
}

// Equipment slots
export const SLOTS = [
  "Head",
  "Neck",
  "Shoulders",
  "Chest",
  "Back",
  "Wrist",
  "Gloves",
  "Main Hand",
  "Off Hand",
  "Belt",
  "Pants",
  "Boots",
  "Ring 1",
  "Ring 2",
  "Trinket 1",
  "Trinket 2",
] as const

export type Slot = (typeof SLOTS)[number]

// Secondary stats
export const SECONDARY_STATS = [
  "Hit",
  "Crit",
  "Haste",
  "Parry",
  "Versatility",
  "Resilience",
  "DG",
  "Expertise",
] as const

export type SecondaryStat = (typeof SECONDARY_STATS)[number]

// Item quality/rarity
export const QUALITY = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const

export type Quality = (typeof QUALITY)[number]

// Set quality (sets can only be rare, epic, or legendary)
export const SET_QUALITY = ["rare", "epic", "legendary"] as const

export type SetQuality = (typeof SET_QUALITY)[number]

// Quality colors (CSS variable names)
export const QUALITY_COLORS: Record<Quality, string> = {
  common: "var(--quality-common)",
  uncommon: "var(--quality-uncommon)",
  rare: "var(--quality-rare)",
  epic: "var(--quality-epic)",
  legendary: "var(--quality-legendary)",
}

// Set bonus colors - derived from tiers
export const SET_COLORS: Record<string, string> = {
  // Dungeon tier sets
  Valorous: "#6366f1", // indigo
  "Beaststalker's": "#22c55e", // green
  Archmage: "#3b82f6", // blue
  Devotion: "#f59e0b", // amber
  Shadowcraft: "#8b5cf6", // violet
  "Shadowcrafter's": "#8b5cf6", // violet (alternate name)

  // Raid tier sets
  Vindicator: "#ef4444", // red
  Predator: "#22c55e", // green
  Illusionist: "#3b82f6", // blue
  "Confessor's": "#f59e0b", // amber
  Madcap: "#8b5cf6", // violet
  Thinker: "#eab308", // yellow

  // Flameheart tier
  Might: "#ef4444", // red
  Giantstalker: "#22c55e", // green
  Arcanist: "#3b82f6", // blue
  Prophetic: "#f59e0b", // amber
  Nightslayer: "#8b5cf6", // violet
  Judgement: "#eab308", // yellow

  // Generic
  Zandalar: "#10b981", // emerald
}

// Gear piece type
export interface GearPiece {
  slot: Slot
  itemName?: string
  ilvl?: number
  secondaryStats?: SecondaryStat[]
  setBonus?: string
  legendary?: string
  quality?: Quality
}

// Character type
export interface Character {
  _id: string
  userId: string
  className: ClassName
  hitPercent: number
  expertisePercent: number
  adventureGear: GearPiece[]
  dungeonGear: GearPiece[]
  createdAt: number
  updatedAt: number
}

// Helper: Create empty gear set with all slots
export function createEmptyGearSet(): GearPiece[] {
  return SLOTS.map((slot) => ({
    slot,
    itemName: undefined,
    ilvl: undefined,
    secondaryStats: undefined,
    setBonus: undefined,
    legendary: undefined,
    quality: undefined,
  }))
}

// Helper: Calculate average item level from gear set
export function calculateAverageIlvl(gear: GearPiece[]): number {
  const itemsWithIlvl = gear.filter((g) => g.ilvl !== undefined && g.ilvl > 0)
  if (itemsWithIlvl.length === 0) return 0

  const total = itemsWithIlvl.reduce((sum, g) => sum + (g.ilvl || 0), 0)
  return Math.round((total / itemsWithIlvl.length) * 10) / 10
}

// Helper: Count set bonuses in gear set
export function countSetBonuses(gear: GearPiece[]): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const piece of gear) {
    if (piece.setBonus) {
      counts[piece.setBonus] = (counts[piece.setBonus] || 0) + 1
    }
  }

  return counts
}

// Helper: Get all legendary items from gear set
export function getLegendaries(gear: GearPiece[]): GearPiece[] {
  return gear.filter((g) => g.legendary)
}

// Helper: Parse comma-separated secondary stats string to array
export function parseSecondaryStats(
  statsString: string | null | undefined,
): SecondaryStat[] | undefined {
  if (!statsString) return undefined

  const parsed = statsString
    .split(",")
    .map((s) => s.trim())
    .filter((s) =>
      SECONDARY_STATS.includes(s as SecondaryStat),
    ) as SecondaryStat[]

  return parsed.length > 0 ? parsed : undefined
}

// Helper: Determine quality from ilvl (approximate)
export function getQualityFromIlvl(ilvl: number | undefined): Quality {
  if (!ilvl) return "common"
  if (ilvl >= 64) return "epic"
  if (ilvl >= 60) return "rare"
  if (ilvl >= 50) return "uncommon"
  return "common"
}

// Helper: Check if a stat is at or above its cap
export function isStatCapped(
  statName: "hit" | "expertise",
  percent: number,
): boolean {
  const caps = {
    hit: 20,
    expertise: 20,
  }
  return percent >= caps[statName]
}

// Helper: Format secondary stats for display
export function formatSecondaryStats(
  stats: SecondaryStat[] | undefined,
): string {
  if (!stats || stats.length === 0) return "-"
  return stats.join(", ")
}
