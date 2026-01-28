import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }
    return await ctx.db
      .query("heroes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
  },
})

export const get = query({
  args: { id: v.id("heroes") },
  handler: async (ctx, args) => {
    const hero = await ctx.db.get(args.id)
    if (!hero) {
      return null
    }
    const identity = await ctx.auth.getUserIdentity()
    if (!identity || hero.userId !== identity.subject) {
      return null
    }
    return hero
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    class: v.string(),
    level: v.number(),
    stats: v.object({
      health: v.number(),
      attack: v.number(),
      defense: v.number(),
    }),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    return await ctx.db.insert("heroes", {
      userId: identity.subject,
      name: args.name,
      class: args.class,
      level: args.level,
      stats: args.stats,
      notes: args.notes,
      createdAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("heroes"),
    name: v.optional(v.string()),
    class: v.optional(v.string()),
    level: v.optional(v.number()),
    stats: v.optional(
      v.object({
        health: v.number(),
        attack: v.number(),
        defense: v.number(),
      }),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    const hero = await ctx.db.get(args.id)
    if (!hero || hero.userId !== identity.subject) {
      throw new Error("Hero not found")
    }
    const { id, ...updates } = args
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    )
    await ctx.db.patch(args.id, filteredUpdates)
  },
})

export const remove = mutation({
  args: { id: v.id("heroes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    const hero = await ctx.db.get(args.id)
    if (!hero || hero.userId !== identity.subject) {
      throw new Error("Hero not found")
    }
    await ctx.db.delete(args.id)
  },
})

export const listByGuildMember = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    // Get caller's guild membership
    const callerMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique()

    if (!callerMembership) {
      return []
    }

    // Verify target user is in the same guild
    const targetMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", callerMembership.guildId).eq("userId", args.userId),
      )
      .unique()

    if (!targetMembership) {
      return []
    }

    // Return target user's heroes
    return await ctx.db
      .query("heroes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
  },
})
