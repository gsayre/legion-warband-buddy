import { v } from "convex/values"
import type { MutationCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"
import {
  CLASSES_VALIDATOR,
  dropLocationValidator,
  SET_QUALITY_VALIDATOR,
  setBonusValidator,
  setPieceValidator,
} from "./schema"

// Helper to require admin access
async function requireAdmin(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Not authenticated")

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique()

  if (!user?.isAdmin) throw new Error("Admin access required")
  return user
}

// List all sets (no auth required - for reference)
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("sets"),
      _creationTime: v.number(),
      name: v.string(),
      quality: SET_QUALITY_VALIDATOR,
      classes: v.array(CLASSES_VALIDATOR),
      dropLocations: v.optional(v.array(dropLocationValidator)),
      pieces: v.array(setPieceValidator),
      bonuses: v.array(setBonusValidator),
      requiredLevel: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("sets").collect()
  },
})

// List sets by class
export const listByClass = query({
  args: { className: CLASSES_VALIDATOR },
  returns: v.array(
    v.object({
      _id: v.id("sets"),
      _creationTime: v.number(),
      name: v.string(),
      quality: SET_QUALITY_VALIDATOR,
      classes: v.array(CLASSES_VALIDATOR),
      dropLocations: v.optional(v.array(dropLocationValidator)),
      pieces: v.array(setPieceValidator),
      bonuses: v.array(setBonusValidator),
      requiredLevel: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const allSets = await ctx.db.query("sets").collect()
    return allSets.filter((set) => set.classes.includes(args.className))
  },
})

// Get a single set by ID
export const get = query({
  args: { id: v.id("sets") },
  returns: v.union(
    v.object({
      _id: v.id("sets"),
      _creationTime: v.number(),
      name: v.string(),
      quality: SET_QUALITY_VALIDATOR,
      classes: v.array(CLASSES_VALIDATOR),
      dropLocations: v.optional(v.array(dropLocationValidator)),
      pieces: v.array(setPieceValidator),
      bonuses: v.array(setBonusValidator),
      requiredLevel: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// Create a new set (admin only)
export const create = mutation({
  args: {
    name: v.string(),
    quality: SET_QUALITY_VALIDATOR,
    classes: v.array(CLASSES_VALIDATOR),
    dropLocations: v.optional(v.array(dropLocationValidator)),
    pieces: v.array(setPieceValidator),
    bonuses: v.array(setBonusValidator),
    requiredLevel: v.optional(v.number()),
  },
  returns: v.id("sets"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    // Check for duplicate name+quality combination
    const existing = await ctx.db
      .query("sets")
      .withIndex("by_name_quality", (q) =>
        q.eq("name", args.name).eq("quality", args.quality),
      )
      .unique()

    if (existing) {
      throw new Error(
        `A ${args.quality} set named "${args.name}" already exists`,
      )
    }

    const now = Date.now()
    return await ctx.db.insert("sets", {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update an existing set (admin only)
export const update = mutation({
  args: {
    id: v.id("sets"),
    name: v.optional(v.string()),
    quality: v.optional(SET_QUALITY_VALIDATOR),
    classes: v.optional(v.array(CLASSES_VALIDATOR)),
    dropLocations: v.optional(v.array(dropLocationValidator)),
    pieces: v.optional(v.array(setPieceValidator)),
    bonuses: v.optional(v.array(setBonusValidator)),
    requiredLevel: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error("Set not found")
    }

    // Check for duplicate name+quality if either is being changed
    const newName = args.name ?? existing.name
    const newQuality = args.quality ?? existing.quality
    if (args.name || args.quality) {
      const duplicate = await ctx.db
        .query("sets")
        .withIndex("by_name_quality", (q) =>
          q.eq("name", newName).eq("quality", newQuality),
        )
        .unique()

      if (duplicate && duplicate._id !== args.id) {
        throw new Error(`A ${newQuality} set named "${newName}" already exists`)
      }
    }

    const { id, ...updates } = args
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })

    return null
  },
})

// Delete a set (admin only)
export const remove = mutation({
  args: { id: v.id("sets") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error("Set not found")
    }

    await ctx.db.delete(args.id)
    return null
  },
})
