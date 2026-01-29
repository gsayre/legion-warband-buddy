import type { ClassName, Quality, SetQuality } from "./character-constants"

// Drop location types
export const DROP_LOCATION_TYPES = [
  "dungeon",
  "raid",
  "world",
  "pvp",
  "crafted",
  "shop",
] as const

export type DropLocationType = (typeof DROP_LOCATION_TYPES)[number]

// Location types (only dungeon and raid have structured locations)
export const LOCATION_TYPES = ["dungeon", "raid"] as const
export type LocationType = (typeof LOCATION_TYPES)[number]

// Helper to check if a drop location type uses structured locations
export function usesStructuredLocations(
  type: DropLocationType,
): type is LocationType {
  return type === "dungeon" || type === "raid"
}

// Drop location
// For dungeon/raid: use locationId and bossId (ID references)
// For other types (world, pvp, crafted, shop): use name and droppedBy (freeform strings)
export interface DropLocation {
  type: DropLocationType
  // For dungeon/raid: ID references
  locationId?: string
  bossId?: string
  // For other types: freeform strings
  name?: string
  droppedBy?: string
}

// Set piece
export interface SetPiece {
  slot: string
  name: string
  dropLocation?: DropLocation
}

// Set bonus
export interface SetBonus {
  pieces: number
  stat: string
  value: number
}

// Available stats for set bonuses
export const BONUS_STATS = [
  // Primary stats
  "Sta",
  "Int",
  "Str",
  "Agi",
  // Secondary stats
  "Hit",
  "Crit",
  "Haste",
  "Parry",
  "Versatility",
  "Resilience",
  "DG",
  "Expertise",
] as const

export type BonusStat = (typeof BONUS_STATS)[number]

// Gear set (from database)
export interface GearSet {
  _id: string
  name: string
  quality: SetQuality
  classes: ClassName[]
  dropLocations?: DropLocation[]
  pieces: SetPiece[]
  bonuses: SetBonus[]
  requiredLevel?: number
  createdAt: number
  updatedAt: number
}

// Form state for creating/editing a set
export interface GearSetFormState {
  name: string
  quality: SetQuality | ""
  classes: ClassName[]
  dropLocations: DropLocation[]
  pieces: SetPiece[]
  bonuses: SetBonus[]
  requiredLevel: number | undefined
}

// Create empty form state
export function createEmptySetFormState(): GearSetFormState {
  return {
    name: "",
    quality: "",
    classes: [],
    dropLocations: [],
    pieces: [],
    bonuses: [],
    requiredLevel: undefined,
  }
}

// Convert a GearSet to form state for editing
export function setToFormState(set: GearSet): GearSetFormState {
  return {
    name: set.name,
    quality: set.quality,
    classes: [...set.classes],
    dropLocations: set.dropLocations ? [...set.dropLocations] : [],
    pieces: [...set.pieces],
    bonuses: [...set.bonuses],
    requiredLevel: set.requiredLevel,
  }
}

// Get list of missing required fields
export function getMissingFields(set: Partial<GearSetFormState>): string[] {
  const missing: string[] = []

  if (!set.name?.trim()) missing.push("name")
  if (!set.quality) missing.push("quality")
  if (!set.classes?.length) missing.push("classes")
  if (!set.pieces?.length) missing.push("pieces")
  if (!set.bonuses?.length) missing.push("bonuses")

  // Check individual pieces for missing names/slots
  set.pieces?.forEach((piece, i) => {
    if (!piece.name?.trim()) missing.push(`pieces[${i}].name`)
    if (!piece.slot?.trim()) missing.push(`pieces[${i}].slot`)
  })

  // Check bonuses for missing stat/value/pieces count
  set.bonuses?.forEach((bonus, i) => {
    if (!bonus.stat?.trim()) missing.push(`bonuses[${i}].stat`)
    if (bonus.value === undefined) missing.push(`bonuses[${i}].value`)
    if (bonus.pieces === undefined || bonus.pieces < 1)
      missing.push(`bonuses[${i}].pieces`)
  })

  return missing
}

// Check if a specific field is missing
export function isFieldMissing(
  fieldPath: string,
  missingFields: string[],
): boolean {
  return missingFields.some(
    (f) => f === fieldPath || f.startsWith(`${fieldPath}[`),
  )
}

// Check if a set has all required fields filled
export function isSetComplete(set: Partial<GearSetFormState>): boolean {
  return getMissingFields(set).length === 0
}

// Display labels for drop location types
export const DROP_LOCATION_TYPE_LABELS: Record<DropLocationType, string> = {
  dungeon: "Dungeon",
  raid: "Raid",
  world: "World Drop",
  pvp: "PvP",
  crafted: "Crafted",
  shop: "Shop",
}

// Quality display labels (capitalized)
export const QUALITY_LABELS: Record<Quality, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
}

// Convert form state drop locations to the format expected by Convex mutations
// This handles the type casting from string to Id<> types
export function convertDropLocationsForMutation(
  dropLocations: DropLocation[],
): unknown[] {
  return dropLocations.map((dl) => ({
    type: dl.type,
    locationId: dl.locationId,
    bossId: dl.bossId,
    name: dl.name,
    droppedBy: dl.droppedBy,
  }))
}

// Convert form state pieces to the format expected by Convex mutations
export function convertPiecesForMutation(pieces: SetPiece[]): unknown[] {
  return pieces.map((piece) => ({
    slot: piece.slot,
    name: piece.name,
    dropLocation: piece.dropLocation
      ? {
          type: piece.dropLocation.type,
          locationId: piece.dropLocation.locationId,
          bossId: piece.dropLocation.bossId,
          name: piece.dropLocation.name,
          droppedBy: piece.dropLocation.droppedBy,
        }
      : undefined,
  }))
}
