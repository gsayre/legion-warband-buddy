import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Validators (mirroring schema.ts)
const CLASSES_VALIDATOR = v.union(
  v.literal("Warrior"),
  v.literal("Rogue"),
  v.literal("Priest"),
  v.literal("Mage"),
  v.literal("Hunter"),
  v.literal("Paladin"),
)

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

const QUALITY_VALIDATOR = v.union(
  v.literal("common"),
  v.literal("uncommon"),
  v.literal("rare"),
  v.literal("epic"),
  v.literal("legendary"),
)

// All slots for creating empty gear sets
const ALL_SLOTS = [
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

function createEmptyGearSet() {
  return ALL_SLOTS.map((slot) => ({
    slot,
    itemName: undefined,
    ilvl: undefined,
    secondaryStats: undefined,
    setBonus: undefined,
    legendary: undefined,
    quality: undefined,
  }))
}

// List all characters for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }
    return await ctx.db
      .query("characters")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()
  },
})

// Get a single character by ID
export const get = query({
  args: { id: v.id("characters") },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.id)
    if (!character) {
      return null
    }
    const identity = await ctx.auth.getUserIdentity()
    if (!identity || character.userId !== identity.subject) {
      return null
    }
    return character
  },
})

// Get character by class for current user
export const getByClass = query({
  args: { className: CLASSES_VALIDATOR },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }
    return await ctx.db
      .query("characters")
      .withIndex("by_user_and_class", (q) =>
        q.eq("userId", identity.subject).eq("className", args.className),
      )
      .unique()
  },
})

// Create a new character (checks for duplicate class)
export const create = mutation({
  args: {
    className: CLASSES_VALIDATOR,
    name: v.optional(v.string()),
    hitPercent: v.optional(v.number()),
    expertisePercent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Check if user already has this class
    const existing = await ctx.db
      .query("characters")
      .withIndex("by_user_and_class", (q) =>
        q.eq("userId", identity.subject).eq("className", args.className),
      )
      .unique()

    if (existing) {
      throw new Error(`You already have a ${args.className} character`)
    }

    const now = Date.now()
    return await ctx.db.insert("characters", {
      userId: identity.subject,
      name: args.name,
      className: args.className,
      hitPercent: args.hitPercent ?? 0,
      expertisePercent: args.expertisePercent ?? 0,
      adventureGear: createEmptyGearSet(),
      dungeonGear: createEmptyGearSet(),
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update character name/stats
export const update = mutation({
  args: {
    id: v.id("characters"),
    name: v.optional(v.string()),
    hitPercent: v.optional(v.number()),
    expertisePercent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== identity.subject) {
      throw new Error("Character not found")
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() }
    if (args.name !== undefined) {
      updates.name = args.name
    }
    if (args.hitPercent !== undefined) {
      updates.hitPercent = args.hitPercent
    }
    if (args.expertisePercent !== undefined) {
      updates.expertisePercent = args.expertisePercent
    }

    await ctx.db.patch(args.id, updates)
  },
})

// Update a single gear slot
export const updateGearPiece = mutation({
  args: {
    id: v.id("characters"),
    gearType: v.union(v.literal("adventure"), v.literal("dungeon")),
    slot: SLOTS_VALIDATOR,
    itemName: v.optional(v.string()),
    ilvl: v.optional(v.number()),
    secondaryStats: v.optional(v.array(SECONDARY_STATS_VALIDATOR)),
    setBonus: v.optional(v.string()),
    legendary: v.optional(v.string()),
    quality: v.optional(QUALITY_VALIDATOR),
    twoHanded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== identity.subject) {
      throw new Error("Character not found")
    }

    const gearField =
      args.gearType === "adventure" ? "adventureGear" : "dungeonGear"
    const currentGear = [...character[gearField]]

    const slotIndex = currentGear.findIndex((g) => g.slot === args.slot)
    if (slotIndex === -1) {
      throw new Error("Invalid slot")
    }

    currentGear[slotIndex] = {
      slot: args.slot,
      itemName: args.itemName,
      ilvl: args.ilvl,
      secondaryStats: args.secondaryStats,
      setBonus: args.setBonus,
      legendary: args.legendary,
      quality: args.quality,
      twoHanded: args.twoHanded,
    }

    // If updating Main Hand with two-handed weapon
    if (args.slot === "Main Hand" && args.twoHanded) {
      // Duplicate stats to Off Hand
      const offHandIndex = currentGear.findIndex((g) => g.slot === "Off Hand")
      if (offHandIndex !== -1) {
        currentGear[offHandIndex] = {
          slot: "Off Hand",
          itemName: args.itemName,
          ilvl: args.ilvl,
          secondaryStats: args.secondaryStats,
          setBonus: args.setBonus,
          legendary: args.legendary,
          quality: args.quality,
          twoHanded: undefined, // Off Hand doesn't have twoHanded flag
        }
      }
    }

    // If updating Main Hand and removing two-handed flag, clear Off Hand
    if (args.slot === "Main Hand" && !args.twoHanded) {
      const offHandIndex = currentGear.findIndex((g) => g.slot === "Off Hand")
      if (offHandIndex !== -1) {
        currentGear[offHandIndex] = {
          slot: "Off Hand",
          itemName: undefined,
          ilvl: undefined,
          secondaryStats: undefined,
          setBonus: undefined,
          legendary: undefined,
          quality: undefined,
          twoHanded: undefined,
        }
      }
    }

    await ctx.db.patch(args.id, {
      [gearField]: currentGear,
      updatedAt: Date.now(),
    })
  },
})

// Delete a character
export const remove = mutation({
  args: { id: v.id("characters") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const character = await ctx.db.get(args.id)
    if (!character || character.userId !== identity.subject) {
      throw new Error("Character not found")
    }

    await ctx.db.delete(args.id)
  },
})

// Valid secondary stat names for parsing
const VALID_STATS = [
  "Hit",
  "Crit",
  "Haste",
  "Parry",
  "Versatility",
  "Resilience",
  "DG",
  "Expertise",
] as const

type SecondaryStat = (typeof VALID_STATS)[number]

// Parse comma-separated stats string
function parseSecondaryStats(
  statsString: string | null | undefined,
): SecondaryStat[] | undefined {
  if (!statsString) return undefined

  const parsed = statsString
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SecondaryStat => VALID_STATS.includes(s as SecondaryStat))

  return parsed.length > 0 ? parsed : undefined
}

// Bulk import characters from JSON
export const importFromJson = mutation({
  args: {
    characters: v.array(
      v.object({
        className: v.string(),
        adventureGear: v.array(
          v.object({
            slot: v.string(),
            ilvl: v.union(v.number(), v.null()),
            secondaryStats: v.union(v.string(), v.null()),
            setBonus: v.optional(v.union(v.string(), v.null())),
            legendary: v.optional(v.union(v.string(), v.null())),
          }),
        ),
        dungeonGear: v.array(
          v.object({
            slot: v.string(),
            ilvl: v.union(v.number(), v.null()),
            secondaryStats: v.union(v.string(), v.null()),
            setBonus: v.optional(v.union(v.string(), v.null())),
            legendary: v.optional(v.union(v.string(), v.null())),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const validClasses = [
      "Warrior",
      "Rogue",
      "Priest",
      "Mage",
      "Hunter",
      "Paladin",
    ]
    const results: { className: string; action: "created" | "updated" }[] = []

    for (const char of args.characters) {
      if (!validClasses.includes(char.className)) {
        continue // Skip invalid classes
      }

      const className = char.className as
        | "Warrior"
        | "Rogue"
        | "Priest"
        | "Mage"
        | "Hunter"
        | "Paladin"

      // Transform gear pieces
      const transformGear = (
        gear: Array<{
          slot: string
          ilvl: number | null
          secondaryStats: string | null
          setBonus?: string | null
          legendary?: string | null
        }>,
      ) => {
        return ALL_SLOTS.map((slot) => {
          const piece = gear.find((g) => g.slot === slot)
          if (!piece || piece.ilvl === null) {
            return {
              slot,
              itemName: undefined,
              ilvl: undefined,
              secondaryStats: undefined,
              setBonus: undefined,
              legendary: undefined,
              quality: undefined,
            }
          }
          return {
            slot,
            itemName: undefined,
            ilvl: piece.ilvl,
            secondaryStats: parseSecondaryStats(piece.secondaryStats),
            setBonus: piece.setBonus || undefined,
            legendary: piece.legendary || undefined,
            quality: undefined,
          }
        })
      }

      const adventureGear = transformGear(char.adventureGear)
      const dungeonGear = transformGear(char.dungeonGear)

      // Check if character exists
      const existing = await ctx.db
        .query("characters")
        .withIndex("by_user_and_class", (q) =>
          q.eq("userId", identity.subject).eq("className", className),
        )
        .unique()

      const now = Date.now()

      if (existing) {
        // Update existing character
        await ctx.db.patch(existing._id, {
          adventureGear,
          dungeonGear,
          updatedAt: now,
        })
        results.push({ className, action: "updated" })
      } else {
        // Create new character
        await ctx.db.insert("characters", {
          userId: identity.subject,
          className,
          hitPercent: 0,
          expertisePercent: 0,
          adventureGear,
          dungeonGear,
          createdAt: now,
          updatedAt: now,
        })
        results.push({ className, action: "created" })
      }
    }

    return results
  },
})

// List characters by guild member (for viewing guildmates' characters)
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

    // Return target user's characters
    return await ctx.db
      .query("characters")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
  },
})
