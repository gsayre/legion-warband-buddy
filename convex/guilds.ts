import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// ============== QUERIES ==============

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("guilds").collect()
  },
})

export const get = query({
  args: { id: v.id("guilds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getOwned = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }
    return await ctx.db
      .query("guilds")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .unique()
  },
})

export const getMyGuild = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }
    const membership = await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique()

    if (!membership) {
      return null
    }
    return await ctx.db.get(membership.guildId)
  },
})

export const getMyMembership = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }
    return await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique()
  },
})

export const getMembers = query({
  args: { guildId: v.id("guilds") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    // Check if the user is a member of this guild
    const membership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", identity.subject),
      )
      .unique()

    if (!membership) {
      return []
    }

    const members = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect()

    // Fetch user info for each member
    const membersWithInfo = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", member.userId))
          .unique()
        return {
          ...member,
          user,
        }
      }),
    )

    return membersWithInfo
  },
})

export const getPendingApplications = query({
  args: { guildId: v.id("guilds") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    // Check if user is the guild owner
    const guild = await ctx.db.get(args.guildId)
    if (!guild || guild.ownerId !== identity.subject) {
      return []
    }

    const applications = await ctx.db
      .query("guildApplications")
      .withIndex("by_guild_and_status", (q) =>
        q.eq("guildId", args.guildId).eq("status", "pending"),
      )
      .collect()

    // Fetch user info for each applicant
    const applicationsWithInfo = await Promise.all(
      applications.map(async (app) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", app.userId))
          .unique()
        return {
          ...app,
          user,
        }
      }),
    )

    return applicationsWithInfo
  },
})

export const getMyApplication = query({
  args: { guildId: v.id("guilds") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const applications = await ctx.db
      .query("guildApplications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()

    return applications.find(
      (app) => app.guildId === args.guildId && app.status === "pending",
    )
  },
})

// ============== MUTATIONS ==============

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Check if user already owns a guild
    const existingOwned = await ctx.db
      .query("guilds")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .unique()

    if (existingOwned) {
      throw new Error("You already own a guild")
    }

    // Check if user is already a member of another guild
    const existingMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique()

    if (existingMembership) {
      throw new Error("You must leave your current guild before creating one")
    }

    // Create the guild
    const guildId = await ctx.db.insert("guilds", {
      name: args.name,
      description: args.description,
      ownerId: identity.subject,
      createdAt: Date.now(),
    })

    // Add owner as a member
    await ctx.db.insert("guildMembers", {
      guildId,
      userId: identity.subject,
      role: "owner",
      joinedAt: Date.now(),
    })

    return guildId
  },
})

export const update = mutation({
  args: {
    id: v.id("guilds"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const guild = await ctx.db.get(args.id)
    if (!guild || guild.ownerId !== identity.subject) {
      throw new Error("Guild not found or you are not the owner")
    }

    const { id, ...updates } = args
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined),
    )

    await ctx.db.patch(args.id, filteredUpdates)
  },
})

export const remove = mutation({
  args: { id: v.id("guilds") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const guild = await ctx.db.get(args.id)
    if (!guild || guild.ownerId !== identity.subject) {
      throw new Error("Guild not found or you are not the owner")
    }

    // Delete all members
    const members = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild", (q) => q.eq("guildId", args.id))
      .collect()

    for (const member of members) {
      await ctx.db.delete(member._id)
    }

    // Delete all applications
    const applications = await ctx.db
      .query("guildApplications")
      .withIndex("by_guild", (q) => q.eq("guildId", args.id))
      .collect()

    for (const app of applications) {
      await ctx.db.delete(app._id)
    }

    // Delete the guild
    await ctx.db.delete(args.id)
  },
})

export const apply = mutation({
  args: {
    guildId: v.id("guilds"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Check if user is already in a guild
    const existingMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique()

    if (existingMembership) {
      throw new Error("You must leave your current guild before applying")
    }

    // Check if user already has a pending application for this guild
    const existingApps = await ctx.db
      .query("guildApplications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()

    const pendingForThisGuild = existingApps.find(
      (app) => app.guildId === args.guildId && app.status === "pending",
    )

    if (pendingForThisGuild) {
      throw new Error("You already have a pending application for this guild")
    }

    // Check if guild exists
    const guild = await ctx.db.get(args.guildId)
    if (!guild) {
      throw new Error("Guild not found")
    }

    return await ctx.db.insert("guildApplications", {
      guildId: args.guildId,
      userId: identity.subject,
      message: args.message,
      status: "pending",
      createdAt: Date.now(),
    })
  },
})

export const cancelApplication = mutation({
  args: { applicationId: v.id("guildApplications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const application = await ctx.db.get(args.applicationId)
    if (!application || application.userId !== identity.subject) {
      throw new Error("Application not found")
    }

    if (application.status !== "pending") {
      throw new Error("Can only cancel pending applications")
    }

    await ctx.db.delete(args.applicationId)
  },
})

export const resolveApplication = mutation({
  args: {
    applicationId: v.id("guildApplications"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const application = await ctx.db.get(args.applicationId)
    if (!application) {
      throw new Error("Application not found")
    }

    // Check if user is the guild owner
    const guild = await ctx.db.get(application.guildId)
    if (!guild || guild.ownerId !== identity.subject) {
      throw new Error("You are not the owner of this guild")
    }

    if (application.status !== "pending") {
      throw new Error("Application has already been resolved")
    }

    // Check if applicant is still not in a guild
    const applicantMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", application.userId))
      .unique()

    if (applicantMembership && args.approved) {
      throw new Error("Applicant has already joined another guild")
    }

    // Update application status
    await ctx.db.patch(args.applicationId, {
      status: args.approved ? "approved" : "rejected",
      resolvedAt: Date.now(),
    })

    // If approved, add as member
    if (args.approved) {
      await ctx.db.insert("guildMembers", {
        guildId: application.guildId,
        userId: application.userId,
        role: "member",
        joinedAt: Date.now(),
      })
    }
  },
})

export const leave = mutation({
  args: { guildId: v.id("guilds") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const membership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", identity.subject),
      )
      .unique()

    if (!membership) {
      throw new Error("You are not a member of this guild")
    }

    if (membership.role === "owner") {
      throw new Error(
        "Guild owners cannot leave. Transfer ownership or delete the guild.",
      )
    }

    await ctx.db.delete(membership._id)
  },
})

export const removeMember = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Check if user is the guild owner
    const guild = await ctx.db.get(args.guildId)
    if (!guild || guild.ownerId !== identity.subject) {
      throw new Error("You are not the owner of this guild")
    }

    // Can't remove self (owner)
    if (args.userId === identity.subject) {
      throw new Error("Cannot remove yourself as owner")
    }

    const membership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_and_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.userId),
      )
      .unique()

    if (!membership) {
      throw new Error("Member not found")
    }

    await ctx.db.delete(membership._id)
  },
})
