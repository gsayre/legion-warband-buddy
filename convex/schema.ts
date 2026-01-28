import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

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
})
