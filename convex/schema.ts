import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// Character class validator
export const CLASSES_VALIDATOR = v.union(
  v.literal("Warrior"),
  v.literal("Rogue"),
  v.literal("Priest"),
  v.literal("Mage"),
  v.literal("Hunter"),
  v.literal("Paladin"),
)

// Equipment slot validator
const SLOTS_VALIDATOR = v.union(
  v.literal("Head"),
  v.literal("Neck"),
  v.literal("Shoulders"),
  v.literal("Chest"),
  v.literal("Back"),
  v.literal("Wrist"),
  v.literal("Gloves"),
  v.literal("Main Hand"),
  v.literal("Off Hand"),
  v.literal("Belt"),
  v.literal("Pants"),
  v.literal("Boots"),
  v.literal("Ring 1"),
  v.literal("Ring 2"),
  v.literal("Trinket 1"),
  v.literal("Trinket 2"),
)

// Secondary stats validator
const SECONDARY_STATS_VALIDATOR = v.union(
  v.literal("Hit"),
  v.literal("Crit"),
  v.literal("Haste"),
  v.literal("Parry"),
  v.literal("Versatility"),
  v.literal("Resilience"),
  v.literal("DG"),
  v.literal("Expertise"),
)

// Item quality validator
export const QUALITY_VALIDATOR = v.union(
  v.literal("common"),
  v.literal("uncommon"),
  v.literal("rare"),
  v.literal("epic"),
  v.literal("legendary"),
)

// Set quality validator (sets can only be rare, epic, or legendary)
export const SET_QUALITY_VALIDATOR = v.union(
  v.literal("rare"),
  v.literal("epic"),
  v.literal("legendary"),
)

// Drop location type validator
export const DROP_LOCATION_TYPE_VALIDATOR = v.union(
  v.literal("dungeon"),
  v.literal("raid"),
  v.literal("world"),
  v.literal("pvp"),
  v.literal("crafted"),
  v.literal("shop"),
)

// Location type validator (only dungeon and raid - types that have structured locations)
export const LOCATION_TYPE_VALIDATOR = v.union(
  v.literal("dungeon"),
  v.literal("raid"),
)

// Drop location validator
// For dungeon/raid: use locationId and bossId (ID references)
// For other types (world, pvp, crafted, shop): use name and droppedBy (freeform strings)
export const dropLocationValidator = v.object({
  type: DROP_LOCATION_TYPE_VALIDATOR,
  // For dungeon/raid: ID references
  locationId: v.optional(v.id("locations")),
  bossId: v.optional(v.id("bosses")),
  // For other types: freeform strings
  name: v.optional(v.string()),
  droppedBy: v.optional(v.string()),
})

// Set piece validator
export const setPieceValidator = v.object({
  slot: v.string(),
  name: v.string(),
  dropLocation: v.optional(dropLocationValidator),
})

// Set bonus validator (stat + value for bonuses like "+20 Sta")
export const setBonusValidator = v.object({
  pieces: v.number(),
  stat: v.string(),
  value: v.number(),
})

// Gear piece validator
const gearPieceValidator = v.object({
  slot: SLOTS_VALIDATOR,
  itemName: v.optional(v.string()),
  ilvl: v.optional(v.number()),
  secondaryStats: v.optional(v.array(SECONDARY_STATS_VALIDATOR)),
  setBonus: v.optional(v.string()),
  legendary: v.optional(v.string()),
  quality: v.optional(QUALITY_VALIDATOR),
})

export default defineSchema({
  heroes: defineTable({
    userId: v.string(),
    name: v.string(),
    class: v.string(),
    level: v.number(),
    stats: v.object({
      health: v.number(),
      attack: v.number(),
      defense: v.number(),
    }),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_name", ["name"]),

  // Users table (synced from Clerk via webhook)
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isAdmin: v.optional(v.boolean()),
  }).index("by_clerk_id", ["clerkId"]),

  // Guilds table
  guilds: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.string(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_name", ["name"]),

  // Guild memberships (including owner)
  guildMembers: defineTable({
    guildId: v.id("guilds"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_guild", ["guildId"])
    .index("by_user", ["userId"])
    .index("by_guild_and_user", ["guildId", "userId"]),

  // Guild applications
  guildApplications: defineTable({
    guildId: v.id("guilds"),
    userId: v.string(),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_guild", ["guildId"])
    .index("by_user", ["userId"])
    .index("by_guild_and_status", ["guildId", "status"]),

  // Characters table (warband gear tracking)
  characters: defineTable({
    userId: v.string(),
    className: CLASSES_VALIDATOR,
    hitPercent: v.number(),
    expertisePercent: v.number(),
    adventureGear: v.array(gearPieceValidator),
    dungeonGear: v.array(gearPieceValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_class", ["userId", "className"]),

  // Sets table (gear set definitions)
  sets: defineTable({
    name: v.string(),
    quality: SET_QUALITY_VALIDATOR,
    classes: v.array(CLASSES_VALIDATOR),
    dropLocations: v.optional(v.array(dropLocationValidator)),
    pieces: v.array(setPieceValidator),
    bonuses: v.array(setBonusValidator),
    requiredLevel: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name_quality", ["name", "quality"])
    .index("by_quality", ["quality"]),

  // Locations table (dungeons and raids only)
  locations: defineTable({
    type: LOCATION_TYPE_VALIDATOR,
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_type_and_name", ["type", "name"]),

  // Bosses table (linked to locations)
  bosses: defineTable({
    locationId: v.id("locations"),
    name: v.string(),
    order: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_location", ["locationId"]),
})
