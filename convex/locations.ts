import { v } from "convex/values"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { mutation, query } from "./_generated/server"
import { LOCATION_TYPE_VALIDATOR, slotDropValidator } from "./schema"

// Helper to require admin access
async function requireAdmin(ctx: MutationCtx | QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Not authenticated")

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique()

  if (!user?.isAdmin) throw new Error("Admin access required")
  return user
}

// ═══════════════════════════════════════════════════════════════════════════
// Location Queries
// ═══════════════════════════════════════════════════════════════════════════

// List all locations (for admin page)
export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("locations"),
      _creationTime: v.number(),
      type: LOCATION_TYPE_VALIDATOR,
      name: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("locations").collect()
  },
})

// List locations filtered by type (for Sets dropdown)
export const listByType = query({
  args: { type: LOCATION_TYPE_VALIDATOR },
  returns: v.array(
    v.object({
      _id: v.id("locations"),
      _creationTime: v.number(),
      type: LOCATION_TYPE_VALIDATOR,
      name: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("locations")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect()
  },
})

// Get a single location by ID
export const get = query({
  args: { id: v.id("locations") },
  returns: v.union(
    v.object({
      _id: v.id("locations"),
      _creationTime: v.number(),
      type: LOCATION_TYPE_VALIDATOR,
      name: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// Boss Queries
// ═══════════════════════════════════════════════════════════════════════════

// List bosses for a location (for Sets dropdown)
export const listBosses = query({
  args: { locationId: v.id("locations") },
  returns: v.array(
    v.object({
      _id: v.id("bosses"),
      _creationTime: v.number(),
      locationId: v.id("locations"),
      name: v.string(),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const bosses = await ctx.db
      .query("bosses")
      .withIndex("by_location", (q) => q.eq("locationId", args.locationId))
      .collect()

    // Sort by order if present, otherwise by creation time
    return bosses.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      if (a.order !== undefined) return -1
      if (b.order !== undefined) return 1
      return a._creationTime - b._creationTime
    })
  },
})

// Get a single boss by ID
export const getBoss = query({
  args: { id: v.id("bosses") },
  returns: v.union(
    v.object({
      _id: v.id("bosses"),
      _creationTime: v.number(),
      locationId: v.id("locations"),
      name: v.string(),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// List all bosses (for drop pattern editor)
export const listAllBosses = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("bosses"),
      _creationTime: v.number(),
      locationId: v.id("locations"),
      name: v.string(),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("bosses").collect()
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// Location Mutations (admin only)
// ═══════════════════════════════════════════════════════════════════════════

// Create a new location
export const create = mutation({
  args: {
    type: LOCATION_TYPE_VALIDATOR,
    name: v.string(),
  },
  returns: v.id("locations"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    // Check for duplicate name+type combination
    const existing = await ctx.db
      .query("locations")
      .withIndex("by_type_and_name", (q) =>
        q.eq("type", args.type).eq("name", args.name),
      )
      .unique()

    if (existing) {
      throw new Error(`A ${args.type} named "${args.name}" already exists`)
    }

    const now = Date.now()
    return await ctx.db.insert("locations", {
      type: args.type,
      name: args.name,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update a location
export const update = mutation({
  args: {
    id: v.id("locations"),
    name: v.optional(v.string()),
    type: v.optional(LOCATION_TYPE_VALIDATOR),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error("Location not found")
    }

    // Check for duplicate name+type if either is being changed
    const newName = args.name ?? existing.name
    const newType = args.type ?? existing.type
    if (args.name || args.type) {
      const duplicate = await ctx.db
        .query("locations")
        .withIndex("by_type_and_name", (q) =>
          q.eq("type", newType).eq("name", newName),
        )
        .unique()

      if (duplicate && duplicate._id !== args.id) {
        throw new Error(`A ${newType} named "${newName}" already exists`)
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

// Delete a location (also deletes all associated bosses)
export const remove = mutation({
  args: { id: v.id("locations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error("Location not found")
    }

    // Delete all bosses associated with this location
    const bosses = await ctx.db
      .query("bosses")
      .withIndex("by_location", (q) => q.eq("locationId", args.id))
      .collect()

    for (const boss of bosses) {
      await ctx.db.delete(boss._id)
    }

    await ctx.db.delete(args.id)
    return null
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// Boss Mutations (admin only)
// ═══════════════════════════════════════════════════════════════════════════

// Add a boss to a location
export const addBoss = mutation({
  args: {
    locationId: v.id("locations"),
    name: v.string(),
    order: v.optional(v.number()),
  },
  returns: v.id("bosses"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    // Verify location exists
    const location = await ctx.db.get(args.locationId)
    if (!location) {
      throw new Error("Location not found")
    }

    const now = Date.now()
    return await ctx.db.insert("bosses", {
      locationId: args.locationId,
      name: args.name,
      order: args.order,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update a boss
export const updateBoss = mutation({
  args: {
    id: v.id("bosses"),
    name: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error("Boss not found")
    }

    const { id, ...updates } = args
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })

    return null
  },
})

// Remove a boss
export const removeBoss = mutation({
  args: { id: v.id("bosses") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error("Boss not found")
    }

    await ctx.db.delete(args.id)
    return null
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// Drop Pattern Queries
// ═══════════════════════════════════════════════════════════════════════════

// List all drop patterns
export const listDropPatterns = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("setDropPatterns"),
      _creationTime: v.number(),
      name: v.string(),
      slotDrops: v.array(slotDropValidator),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("setDropPatterns").collect()
  },
})

// Get a single drop pattern by ID
export const getDropPattern = query({
  args: { id: v.id("setDropPatterns") },
  returns: v.union(
    v.object({
      _id: v.id("setDropPatterns"),
      _creationTime: v.number(),
      name: v.string(),
      slotDrops: v.array(slotDropValidator),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// ═══════════════════════════════════════════════════════════════════════════
// Drop Pattern Mutations (admin only)
// ═══════════════════════════════════════════════════════════════════════════

// Create a new drop pattern
export const createDropPattern = mutation({
  args: {
    name: v.string(),
    slotDrops: v.array(slotDropValidator),
  },
  returns: v.id("setDropPatterns"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    // Check for duplicate name
    const existing = await ctx.db
      .query("setDropPatterns")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique()

    if (existing) {
      throw new Error(`A drop pattern named "${args.name}" already exists`)
    }

    const now = Date.now()
    return await ctx.db.insert("setDropPatterns", {
      name: args.name,
      slotDrops: args.slotDrops,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update a drop pattern
export const updateDropPattern = mutation({
  args: {
    id: v.id("setDropPatterns"),
    name: v.optional(v.string()),
    slotDrops: v.optional(v.array(slotDropValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error("Drop pattern not found")
    }

    // Check for duplicate name if name is being changed
    if (args.name && args.name !== existing.name) {
      const newName = args.name
      const duplicate = await ctx.db
        .query("setDropPatterns")
        .withIndex("by_name", (q) => q.eq("name", newName))
        .unique()

      if (duplicate) {
        throw new Error(`A drop pattern named "${newName}" already exists`)
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

// Delete a drop pattern
export const removeDropPattern = mutation({
  args: { id: v.id("setDropPatterns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.get(args.id)
    if (!existing) {
      throw new Error("Drop pattern not found")
    }

    // Check if any sets are using this pattern
    const setsUsingPattern = await ctx.db.query("sets").collect()
    const usedBy = setsUsingPattern.filter(
      (set) => set.dropPatternId === args.id,
    )

    if (usedBy.length > 0) {
      const setNames = usedBy.map((s) => s.name).join(", ")
      throw new Error(`Cannot delete drop pattern. It is used by: ${setNames}`)
    }

    await ctx.db.delete(args.id)
    return null
  },
})
