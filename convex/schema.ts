import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// Character class validator
const CLASSES_VALIDATOR = v.union(
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
const QUALITY_VALIDATOR = v.union(
  v.literal("common"),
  v.literal("uncommon"),
  v.literal("rare"),
  v.literal("epic"),
  v.literal("legendary"),
)

// Gear piece validator
const gearPieceValidator = v.object({
  slot: SLOTS_VALIDATOR,
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
})
