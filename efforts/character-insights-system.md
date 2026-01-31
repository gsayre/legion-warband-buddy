# Character Insights System

## Overview

A hybrid insights system that analyzes character gear and provides actionable recommendations for improvement. The system combines code-defined insight engines (for complex logic) with admin-configurable thresholds and priorities (for flexibility without deploys).

## Goals

1. Help players identify weak points across their warband
2. Prioritize improvements with clear tiers (critical → nice-to-have)
3. Provide specific, actionable recommendations (what to change, where to get it)
4. Support the game's progression model (lead character + catch-up mechanics)
5. Allow admins to tune thresholds and add new rules over time

---

## Architecture

### Hybrid Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                     INSIGHT SYSTEM                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐          │
│  │   INSIGHT ENGINES    │    │  ADMIN CONFIGURATION  │          │
│  │   (Code-Defined)     │    │  (Database-Stored)    │          │
│  ├──────────────────────┤    ├──────────────────────┤          │
│  │ • GearLevelEngine    │    │ • Thresholds          │          │
│  │ • StatCapEngine      │    │ • Tier priorities     │          │
│  │ • SetBonusEngine     │    │ • Enable/disable      │          │
│  │ • StatPriorityEngine │    │ • Custom messages     │          │
│  │ • GearCompletenessEng│    │ • Class-specific vals │          │
│  └──────────────────────┘    └──────────────────────┘          │
│              │                          │                       │
│              └──────────┬───────────────┘                       │
│                         ▼                                       │
│              ┌──────────────────────┐                          │
│              │   INSIGHT AGGREGATOR │                          │
│              │   (Combines & Ranks) │                          │
│              └──────────────────────┘                          │
│                         │                                       │
│                         ▼                                       │
│              ┌──────────────────────┐                          │
│              │   INSIGHTS OUTPUT    │                          │
│              │ • Per-character      │                          │
│              │ • Warband-wide       │                          │
│              │ • Priority-sorted    │                          │
│              └──────────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model Changes

### 1. Two-Handed Weapon Support

Add `isTwoHanded` field to gear pieces for Main Hand slot:

```typescript
// convex/schema.ts - Update gearPieceValidator
const gearPieceValidator = v.object({
  slot: EQUIPMENT_SLOTS_VALIDATOR,
  itemName: v.optional(v.string()),
  ilvl: v.optional(v.number()),
  secondaryStats: v.optional(v.array(SECONDARY_STATS_VALIDATOR)),
  setBonus: v.optional(v.string()),
  legendary: v.optional(v.string()),
  quality: v.optional(QUALITY_VALIDATOR),
  isTwoHanded: v.optional(v.boolean()), // NEW FIELD
})
```

**Behavior:**
- Only applicable when `slot === "Main Hand"`
- When `true`, Off Hand slot is considered "filled" with duplicated stats
- UI should gray out / auto-fill Off Hand when Main Hand is two-handed
- Insight engines respect this when checking for empty slots

### 2. Insight Configuration Table

```typescript
// convex/schema.ts - New table
insightConfig: defineTable({
  // Thresholds
  targetAdventureIlvl: v.number(),      // Default: 60
  targetDungeonIlvl: v.number(),        // Default: 60
  hitCap: v.number(),                   // Default: 20
  expertiseCap: v.number(),             // Default: 20

  // Stat priorities by class
  statPriorities: v.object({
    Warrior: v.array(v.string()),       // e.g., ["Hit", "Expertise", "Parry"]
    Rogue: v.array(v.string()),
    Priest: v.array(v.string()),
    Mage: v.array(v.string()),
    Hunter: v.array(v.string()),
    Paladin: v.array(v.string()),
  }),

  // Tier definitions
  insightTiers: v.array(v.object({
    id: v.string(),
    name: v.string(),                   // e.g., "Critical", "Important", "Optimization"
    priority: v.number(),               // Lower = higher priority
    color: v.string(),                  // For UI display
  })),

  // Engine toggles
  enabledEngines: v.array(v.string()),  // Which engines are active

  updatedAt: v.number(),
})
```

**Default Configuration:**

```typescript
const DEFAULT_CONFIG = {
  targetAdventureIlvl: 60,
  targetDungeonIlvl: 60,
  hitCap: 20,
  expertiseCap: 20,
  statPriorities: {
    Warrior: ["Hit", "Expertise", "Parry", "Versatility"],
    Rogue: ["Hit", "Expertise", "Crit", "Versatility"],
    Priest: ["Hit", "Expertise", "Haste", "Versatility"],
    Mage: ["Hit", "Expertise", "Crit", "Versatility"],
    Hunter: ["Hit", "Expertise", "Crit", "Versatility"],
    Paladin: ["Hit", "Expertise", "Parry", "Versatility"],
  },
  insightTiers: [
    { id: "critical", name: "Critical", priority: 1, color: "red" },
    { id: "important", name: "Important", priority: 2, color: "orange" },
    { id: "optimization", name: "Optimization", priority: 3, color: "yellow" },
    { id: "opportunity", name: "Opportunity", priority: 4, color: "blue" },
  ],
  enabledEngines: [
    "gearLevel",
    "statCap",
    "setBonus",
    "statPriority",
    "gearCompleteness",
  ],
}
```

---

## Insight Engines

### Engine Interface

```typescript
// src/lib/insights/types.ts

export interface Insight {
  id: string                    // Unique identifier
  engineId: string              // Which engine generated this
  tier: InsightTier             // Priority tier
  characterId: Id<"characters"> // Which character
  gearMode: "adventure" | "dungeon"

  // Display
  title: string                 // Short summary
  description: string           // Detailed explanation

  // Actionable data
  affectedSlots?: Slot[]        // Which gear slots
  suggestedAction?: string      // What to do
  dropSources?: DropSource[]    // Where to get recommended items

  // Metrics
  currentValue?: number         // Current state
  targetValue?: number          // Goal state
  improvement?: number          // How much better
}

export interface DropSource {
  type: "dungeon" | "raid" | "world" | "pvp" | "crafted" | "shop" | "auction"
  locationName?: string
  bossName?: string
  itemName?: string
}

export interface InsightEngine {
  id: string
  name: string
  analyze(
    character: Character,
    gearMode: "adventure" | "dungeon",
    config: InsightConfig,
    sets: Set[],
    locations: Location[],
  ): Insight[]
}
```

### Engine 1: Gear Level Engine

**Purpose:** Identify gear not at target item level

```typescript
// src/lib/insights/engines/gear-level-engine.ts

export const gearLevelEngine: InsightEngine = {
  id: "gearLevel",
  name: "Gear Level Analysis",

  analyze(character, gearMode, config, sets, locations) {
    const insights: Insight[] = []
    const gear = gearMode === "adventure"
      ? character.adventureGear
      : character.dungeonGear
    const targetIlvl = gearMode === "adventure"
      ? config.targetAdventureIlvl
      : config.targetDungeonIlvl

    // Check each slot
    const underLevelSlots = gear.filter(g =>
      g.ilvl && g.ilvl < targetIlvl
    )

    if (underLevelSlots.length > 0) {
      const avgDeficit = underLevelSlots.reduce(
        (sum, g) => sum + (targetIlvl - (g.ilvl || 0)), 0
      ) / underLevelSlots.length

      // Determine tier based on severity
      const tier = avgDeficit > 10 ? "critical"
                 : avgDeficit > 5 ? "important"
                 : "optimization"

      insights.push({
        id: `gear-level-${gearMode}-${character._id}`,
        engineId: "gearLevel",
        tier,
        characterId: character._id,
        gearMode,
        title: `${underLevelSlots.length} items below ilvl ${targetIlvl}`,
        description: `${gearMode === "adventure" ? "Adventure" : "Dungeon"} gear has ${underLevelSlots.length} pieces under the target item level.`,
        affectedSlots: underLevelSlots.map(g => g.slot),
        currentValue: Math.round(calculateAverageIlvl(gear)),
        targetValue: targetIlvl,
      })
    }

    return insights
  }
}
```

### Engine 2: Stat Cap Engine

**Purpose:** Check hit/expertise caps, identify waste

```typescript
// src/lib/insights/engines/stat-cap-engine.ts

export const statCapEngine: InsightEngine = {
  id: "statCap",
  name: "Stat Cap Analysis",

  analyze(character, gearMode, config, sets, locations) {
    const insights: Insight[] = []

    // Under cap checks
    if (character.hitPercent < config.hitCap) {
      insights.push({
        id: `hit-under-cap-${character._id}`,
        engineId: "statCap",
        tier: "critical",
        characterId: character._id,
        gearMode,
        title: "Hit below cap",
        description: `Hit is at ${character.hitPercent}%, which is ${config.hitCap - character.hitPercent}% below the ${config.hitCap}% cap. Missing attacks significantly reduces damage output.`,
        currentValue: character.hitPercent,
        targetValue: config.hitCap,
        suggestedAction: "Prioritize gear with Hit stat until capped",
      })
    }

    if (character.expertisePercent < config.expertiseCap) {
      insights.push({
        id: `expertise-under-cap-${character._id}`,
        engineId: "statCap",
        tier: "critical",
        characterId: character._id,
        gearMode,
        title: "Expertise below cap",
        description: `Expertise is at ${character.expertisePercent}%, which is ${config.expertiseCap - character.expertisePercent}% below the ${config.expertiseCap}% cap.`,
        currentValue: character.expertisePercent,
        targetValue: config.expertiseCap,
        suggestedAction: "Prioritize gear with Expertise stat until capped",
      })
    }

    // Over cap checks (wasted stats)
    const hitWaste = character.hitPercent - config.hitCap
    if (hitWaste > 2) { // Only flag if significantly over
      insights.push({
        id: `hit-over-cap-${character._id}`,
        engineId: "statCap",
        tier: "optimization",
        characterId: character._id,
        gearMode,
        title: "Excess Hit stat",
        description: `Hit is ${hitWaste.toFixed(1)}% over cap. This stat budget could be used for more valuable stats.`,
        currentValue: character.hitPercent,
        targetValue: config.hitCap,
        suggestedAction: "Consider swapping Hit gear for pieces with better secondary stats",
      })
    }

    // Similar for expertise waste...

    return insights
  }
}
```

### Engine 3: Set Bonus Engine

**Purpose:** Track set progress, suggest missing pieces

```typescript
// src/lib/insights/engines/set-bonus-engine.ts

export const setBonusEngine: InsightEngine = {
  id: "setBonus",
  name: "Set Bonus Analysis",

  analyze(character, gearMode, config, sets, locations) {
    const insights: Insight[] = []
    const gear = gearMode === "adventure"
      ? character.adventureGear
      : character.dungeonGear

    // Get sets relevant to this class
    const classSets = sets.filter(s =>
      s.classes.includes(character.className)
    )

    // Count equipped pieces per set
    const setBonusCounts = countSetBonuses(gear)

    for (const set of classSets) {
      const equippedCount = setBonusCounts[set.name] || 0

      // Find nearest bonus threshold
      const sortedBonuses = [...set.bonuses].sort((a, b) => a.pieces - b.pieces)
      const nextBonus = sortedBonuses.find(b => b.pieces > equippedCount)

      if (nextBonus && equippedCount > 0) {
        const piecesNeeded = nextBonus.pieces - equippedCount

        // Close to a bonus (1-2 pieces away)
        if (piecesNeeded <= 2) {
          // Find which slots are missing
          const equippedSlots = gear
            .filter(g => g.setBonus === set.name)
            .map(g => g.slot)
          const missingPieces = set.pieces.filter(
            p => !equippedSlots.includes(p.slot)
          )

          // Get drop sources for missing pieces
          const dropSources = missingPieces
            .filter(p => p.dropLocation)
            .map(p => ({
              type: p.dropLocation!.type,
              locationName: p.dropLocation!.name,
              bossName: p.dropLocation!.droppedBy,
              itemName: p.name,
            }))

          insights.push({
            id: `set-bonus-close-${set.name}-${character._id}`,
            engineId: "setBonus",
            tier: piecesNeeded === 1 ? "important" : "optimization",
            characterId: character._id,
            gearMode,
            title: `${piecesNeeded} piece${piecesNeeded > 1 ? "s" : ""} from ${set.name} (${nextBonus.pieces})pc bonus`,
            description: `You have ${equippedCount}/${nextBonus.pieces} pieces of ${set.name}. Getting ${piecesNeeded} more piece${piecesNeeded > 1 ? "s" : ""} will unlock: ${formatSetBonus(nextBonus)}`,
            affectedSlots: missingPieces.map(p => p.slot as Slot),
            dropSources,
            currentValue: equippedCount,
            targetValue: nextBonus.pieces,
            suggestedAction: `Farm ${missingPieces.map(p => p.slot).join(", ")} slots`,
          })
        }
      }
    }

    return insights
  }
}
```

### Engine 4: Stat Priority Engine

**Purpose:** Ensure gear has correct stats for class

```typescript
// src/lib/insights/engines/stat-priority-engine.ts

export const statPriorityEngine: InsightEngine = {
  id: "statPriority",
  name: "Stat Priority Analysis",

  analyze(character, gearMode, config, sets, locations) {
    const insights: Insight[] = []
    const gear = gearMode === "adventure"
      ? character.adventureGear
      : character.dungeonGear
    const priorities = config.statPriorities[character.className]

    // Check for Versatility on all pieces (required)
    const missingVersatility = gear.filter(g =>
      g.itemName && // Has gear equipped
      g.secondaryStats &&
      !g.secondaryStats.includes("Versatility")
    )

    if (missingVersatility.length > 0) {
      insights.push({
        id: `missing-versatility-${character._id}`,
        engineId: "statPriority",
        tier: "important",
        characterId: character._id,
        gearMode,
        title: `${missingVersatility.length} pieces missing Versatility`,
        description: "All gear should have Versatility as one of its secondary stats.",
        affectedSlots: missingVersatility.map(g => g.slot),
        suggestedAction: "Replace with gear that has Versatility",
      })
    }

    // Check for wrong secondary stats (class-specific)
    const classSpecificStat = priorities[2] // After Hit and Expertise
    const wrongStats = gear.filter(g => {
      if (!g.secondaryStats || g.secondaryStats.length < 2) return false
      // Has neither Versatility nor class stat
      return !g.secondaryStats.includes("Versatility") &&
             !g.secondaryStats.includes(classSpecificStat)
    })

    if (wrongStats.length > 0) {
      insights.push({
        id: `suboptimal-stats-${character._id}`,
        engineId: "statPriority",
        tier: "optimization",
        characterId: character._id,
        gearMode,
        title: `${wrongStats.length} pieces with suboptimal stats`,
        description: `As a ${character.className}, prioritize: ${priorities.join(" > ")}`,
        affectedSlots: wrongStats.map(g => g.slot),
      })
    }

    return insights
  }
}
```

### Engine 5: Gear Completeness Engine

**Purpose:** Find empty slots, track legendary opportunities

```typescript
// src/lib/insights/engines/gear-completeness-engine.ts

export const gearCompletenessEngine: InsightEngine = {
  id: "gearCompleteness",
  name: "Gear Completeness Analysis",

  analyze(character, gearMode, config, sets, locations) {
    const insights: Insight[] = []
    const gear = gearMode === "adventure"
      ? character.adventureGear
      : character.dungeonGear

    // Check for empty slots
    const emptySlots = gear.filter(g => !g.itemName && !g.ilvl)

    // Handle two-handed weapons
    const mainHand = gear.find(g => g.slot === "Main Hand")
    const filteredEmptySlots = emptySlots.filter(g => {
      // Don't flag off-hand as empty if main hand is two-handed
      if (g.slot === "Off Hand" && mainHand?.isTwoHanded) {
        return false
      }
      return true
    })

    if (filteredEmptySlots.length > 0) {
      insights.push({
        id: `empty-slots-${gearMode}-${character._id}`,
        engineId: "gearCompleteness",
        tier: "critical",
        characterId: character._id,
        gearMode,
        title: `${filteredEmptySlots.length} empty gear slot${filteredEmptySlots.length > 1 ? "s" : ""}`,
        description: `Missing gear in: ${filteredEmptySlots.map(g => g.slot).join(", ")}`,
        affectedSlots: filteredEmptySlots.map(g => g.slot),
        suggestedAction: "Equip any gear in empty slots",
      })
    }

    // Legendary opportunities
    const currentLegendaries = gear.filter(g => g.legendary)
    const potentialLegendarySlots = ["Chest", "Main Hand", "Head", "Trinket 1", "Trinket 2"]
    const missingLegendarySlots = potentialLegendarySlots.filter(slot => {
      const gearInSlot = gear.find(g => g.slot === slot)
      return gearInSlot && gearInSlot.itemName && !gearInSlot.legendary
    })

    if (missingLegendarySlots.length > 0) {
      insights.push({
        id: `legendary-opportunity-${character._id}`,
        engineId: "gearCompleteness",
        tier: "opportunity",
        characterId: character._id,
        gearMode,
        title: "Legendary items available",
        description: `Legendary items can drop for: ${missingLegendarySlots.join(", ")}. These are often significant upgrades.`,
        affectedSlots: missingLegendarySlots as Slot[],
      })
    }

    return insights
  }
}
```

### Engine 6: Warband Balance Engine

**Purpose:** Identify lagging characters (excluding lead)

```typescript
// src/lib/insights/engines/warband-balance-engine.ts

export const warbandBalanceEngine = {
  id: "warbandBalance",
  name: "Warband Balance Analysis",

  analyzeWarband(
    characters: Character[],
    gearMode: "adventure" | "dungeon",
    config: InsightConfig,
  ): Insight[] {
    const insights: Insight[] = []

    if (characters.length < 2) return insights

    // Calculate average ilvl for each character
    const charIlvls = characters.map(c => ({
      character: c,
      ilvl: calculateAverageIlvl(
        gearMode === "adventure" ? c.adventureGear : c.dungeonGear
      )
    }))

    // Find the lead character (highest ilvl - intentionally ahead)
    const sortedByIlvl = [...charIlvls].sort((a, b) => b.ilvl - a.ilvl)
    const leadCharacter = sortedByIlvl[0]

    // Calculate average of non-lead characters
    const nonLeadChars = sortedByIlvl.slice(1)
    const avgNonLeadIlvl = nonLeadChars.reduce((sum, c) => sum + c.ilvl, 0) / nonLeadChars.length

    // Find characters significantly below average (excluding lead)
    const laggingThreshold = avgNonLeadIlvl - 5 // 5 ilvl behind average
    const laggingChars = nonLeadChars.filter(c => c.ilvl < laggingThreshold)

    for (const { character, ilvl } of laggingChars) {
      insights.push({
        id: `warband-lagging-${character._id}`,
        engineId: "warbandBalance",
        tier: "important",
        characterId: character._id,
        gearMode,
        title: `${character.className} behind warband average`,
        description: `This character (ilvl ${ilvl.toFixed(1)}) is ${(avgNonLeadIlvl - ilvl).toFixed(1)} levels behind your warband average. Consider using catch-up mechanics from your ${leadCharacter.character.className}.`,
        currentValue: ilvl,
        targetValue: avgNonLeadIlvl,
      })
    }

    return insights
  }
}
```

---

## Insight Aggregator

```typescript
// src/lib/insights/aggregator.ts

import { gearLevelEngine } from "./engines/gear-level-engine"
import { statCapEngine } from "./engines/stat-cap-engine"
import { setBonusEngine } from "./engines/set-bonus-engine"
import { statPriorityEngine } from "./engines/stat-priority-engine"
import { gearCompletenessEngine } from "./engines/gear-completeness-engine"
import { warbandBalanceEngine } from "./engines/warband-balance-engine"

const ENGINES = [
  gearLevelEngine,
  statCapEngine,
  setBonusEngine,
  statPriorityEngine,
  gearCompletenessEngine,
]

export function analyzeCharacter(
  character: Character,
  gearMode: "adventure" | "dungeon",
  config: InsightConfig,
  sets: Set[],
  locations: Location[],
): Insight[] {
  const enabledEngines = ENGINES.filter(e =>
    config.enabledEngines.includes(e.id)
  )

  const insights = enabledEngines.flatMap(engine =>
    engine.analyze(character, gearMode, config, sets, locations)
  )

  // Sort by tier priority
  return insights.sort((a, b) => {
    const tierA = config.insightTiers.find(t => t.id === a.tier)
    const tierB = config.insightTiers.find(t => t.id === b.tier)
    return (tierA?.priority || 99) - (tierB?.priority || 99)
  })
}

export function analyzeWarband(
  characters: Character[],
  gearMode: "adventure" | "dungeon",
  config: InsightConfig,
  sets: Set[],
  locations: Location[],
): {
  byCharacter: Map<Id<"characters">, Insight[]>
  warbandWide: Insight[]
  summary: WarbandSummary
} {
  const byCharacter = new Map<Id<"characters">, Insight[]>()

  // Analyze each character
  for (const character of characters) {
    byCharacter.set(
      character._id,
      analyzeCharacter(character, gearMode, config, sets, locations)
    )
  }

  // Warband-wide analysis
  const warbandWide = warbandBalanceEngine.analyzeWarband(
    characters, gearMode, config
  )

  // Summary stats
  const allInsights = [...byCharacter.values()].flat()
  const summary = {
    totalInsights: allInsights.length,
    criticalCount: allInsights.filter(i => i.tier === "critical").length,
    importantCount: allInsights.filter(i => i.tier === "important").length,
    optimizationCount: allInsights.filter(i => i.tier === "optimization").length,
    opportunityCount: allInsights.filter(i => i.tier === "opportunity").length,
  }

  return { byCharacter, warbandWide, summary }
}
```

---

## UI Components

### 1. Insights Dashboard (New Route)

```
/insights - Warband-wide insights view
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Warband Insights                              [Adventure|Dungeon]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─ Summary ───────────────────────────────────────────────────┐ │
│ │ 🔴 3 Critical  🟠 5 Important  🟡 8 Optimization  🔵 2 Opp  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Critical Issues ───────────────────────────────────────────┐ │
│ │                                                              │ │
│ │ [Warrior] Hit below cap (15.2% / 20%)                       │ │
│ │ Prioritize gear with Hit stat until capped                  │ │
│ │                                                              │ │
│ │ [Mage] 3 empty gear slots                                   │ │
│ │ Missing: Head, Neck, Ring 2                                 │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Important ─────────────────────────────────────────────────┐ │
│ │ [Rogue] 1 piece from Nightslayer (4)pc bonus               │ │
│ │ Farm Gloves from: Onyxia (Raid)                            │ │
│ │ Bonus: +100 Agility, +50 Crit                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Character Insights Panel

Add to existing character detail page (`/characters/$characterId`):

```
┌─ Insights ─────────────────────────────────────────────────────┐
│                                                                 │
│ 🔴 Hit below cap                                               │
│    15.2% / 20% (-4.8%)                                         │
│    → Prioritize gear with Hit stat                             │
│                                                                 │
│ 🟠 1 piece from Valor (4)pc                                    │
│    Head from: Ragnaros (Molten Core)                           │
│    → +150 Strength, +75 Parry                                  │
│                                                                 │
│ 🟡 2 pieces with suboptimal stats                              │
│    Chest, Boots missing Versatility                            │
│                                                                 │
│ 🔵 Legendary available                                         │
│    Trinket 1, Trinket 2 slots                                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 3. Insight Card Component

```typescript
// src/components/insights/InsightCard.tsx

interface InsightCardProps {
  insight: Insight
  characterName?: string
  showCharacter?: boolean
}

export function InsightCard({ insight, characterName, showCharacter }: InsightCardProps) {
  const tierConfig = {
    critical: { color: "red", icon: "🔴", bg: "bg-red-50" },
    important: { color: "orange", icon: "🟠", bg: "bg-orange-50" },
    optimization: { color: "yellow", icon: "🟡", bg: "bg-yellow-50" },
    opportunity: { color: "blue", icon: "🔵", bg: "bg-blue-50" },
  }

  const config = tierConfig[insight.tier]

  return (
    <Card className={cn("border-l-4", `border-l-${config.color}-500`, config.bg)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          {showCharacter && characterName && (
            <Badge variant="outline">{characterName}</Badge>
          )}
          <CardTitle className="text-sm font-medium">
            {insight.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">
          {insight.description}
        </p>

        {insight.suggestedAction && (
          <p className="text-sm mt-2">
            → {insight.suggestedAction}
          </p>
        )}

        {insight.dropSources && insight.dropSources.length > 0 && (
          <div className="mt-2 text-sm">
            <strong>Where to get it:</strong>
            <ul className="list-disc list-inside">
              {insight.dropSources.map((source, i) => (
                <li key={i}>
                  {source.itemName}: {source.bossName} ({source.locationName})
                </li>
              ))}
            </ul>
          </div>
        )}

        {insight.currentValue !== undefined && insight.targetValue !== undefined && (
          <div className="mt-2">
            <Progress
              value={(insight.currentValue / insight.targetValue) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {insight.currentValue} / {insight.targetValue}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 4. Admin Configuration UI

Add to `/data` or new `/admin/insights` route:

```
┌─ Insight Configuration ────────────────────────────────────────┐
│                                                                 │
│ Thresholds                                                      │
│ ┌─────────────────┬─────────────────┐                          │
│ │ Adventure ilvl  │ [60        ]    │                          │
│ │ Dungeon ilvl    │ [60        ]    │                          │
│ │ Hit Cap         │ [20        ] %  │                          │
│ │ Expertise Cap   │ [20        ] %  │                          │
│ └─────────────────┴─────────────────┘                          │
│                                                                 │
│ Stat Priorities by Class                                        │
│ ┌─────────┬──────────────────────────────────────────────────┐ │
│ │ Warrior │ [Hit] > [Expertise] > [Parry] > [Versatility]    │ │
│ │ Rogue   │ [Hit] > [Expertise] > [Crit] > [Versatility]     │ │
│ │ ...     │                                                   │ │
│ └─────────┴──────────────────────────────────────────────────┘ │
│                                                                 │
│ Active Engines                                                  │
│ [x] Gear Level Analysis                                         │
│ [x] Stat Cap Analysis                                           │
│ [x] Set Bonus Analysis                                          │
│ [x] Stat Priority Analysis                                      │
│ [x] Gear Completeness                                           │
│                                                                 │
│                                          [Save Configuration]   │
└────────────────────────────────────────────────────────────────┘
```

---

## Convex Queries & Mutations

### Insight Config Operations

```typescript
// convex/insights.ts

// Get config (with defaults if none exists)
export const getConfig = query({
  args: {},
  returns: v.object({ /* InsightConfig shape */ }),
  handler: async (ctx) => {
    const config = await ctx.db.query("insightConfig").first()
    return config || DEFAULT_CONFIG
  },
})

// Update config (admin only)
export const updateConfig = mutation({
  args: {
    targetAdventureIlvl: v.optional(v.number()),
    targetDungeonIlvl: v.optional(v.number()),
    hitCap: v.optional(v.number()),
    expertiseCap: v.optional(v.number()),
    statPriorities: v.optional(v.object({ /* ... */ })),
    enabledEngines: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const existing = await ctx.db.query("insightConfig").first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.insert("insightConfig", {
        ...DEFAULT_CONFIG,
        ...args,
        updatedAt: Date.now(),
      })
    }
  },
})
```

### Insight Analysis Query

```typescript
// convex/insights.ts

// Analyze a single character
export const analyzeCharacter = query({
  args: {
    characterId: v.id("characters"),
    gearMode: v.union(v.literal("adventure"), v.literal("dungeon")),
  },
  returns: v.array(InsightValidator),
  handler: async (ctx, { characterId, gearMode }) => {
    const character = await ctx.db.get(characterId)
    if (!character) throw new Error("Character not found")

    const config = await getConfig(ctx, {})
    const sets = await ctx.db.query("sets").collect()
    const locations = await ctx.db.query("locations").collect()

    // Run analysis (imported from shared lib)
    return analyzeCharacter(character, gearMode, config, sets, locations)
  },
})

// Analyze full warband
export const analyzeWarband = query({
  args: {
    gearMode: v.union(v.literal("adventure"), v.literal("dungeon")),
  },
  returns: WarbandAnalysisValidator,
  handler: async (ctx, { gearMode }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const characters = await ctx.db
      .query("characters")
      .withIndex("by_user", q => q.eq("userId", identity.subject))
      .collect()

    const config = await getConfig(ctx, {})
    const sets = await ctx.db.query("sets").collect()
    const locations = await ctx.db.query("locations").collect()

    return analyzeWarband(characters, gearMode, config, sets, locations)
  },
})
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Add `isTwoHanded` field to gear piece schema
- [ ] Create `insightConfig` table with default values
- [ ] Define insight types and interfaces
- [ ] Implement insight aggregator structure

### Phase 2: Core Engines (Week 2)
- [ ] Implement Gear Level Engine
- [ ] Implement Stat Cap Engine
- [ ] Implement Gear Completeness Engine (with two-handed support)
- [ ] Add basic Convex queries for analysis

### Phase 3: Advanced Engines (Week 3)
- [ ] Implement Set Bonus Engine with drop source recommendations
- [ ] Implement Stat Priority Engine
- [ ] Implement Warband Balance Engine
- [ ] Connect to existing sets/locations data

### Phase 4: UI Components (Week 4)
- [ ] Create InsightCard component
- [ ] Add Insights panel to character detail page
- [ ] Create Warband Insights dashboard route
- [ ] Add summary badges to character cards

### Phase 5: Admin Configuration (Week 5)
- [ ] Create insight config admin UI
- [ ] Add stat priority configuration per class
- [ ] Add engine enable/disable toggles
- [ ] Add threshold configuration

### Phase 6: Polish & Testing (Week 6)
- [ ] Add loading states and error handling
- [ ] Write tests for insight engines
- [ ] Performance optimization (memoization, selective queries)
- [ ] User feedback and iteration

---

## Future Enhancements

### Phase 2 Features (Future)
- **Stat Value Calculations**: Convert raw stat points to percentages
- **Gear Swap Recommendations**: "Swap X for Y to gain Z"
- **Diminishing Returns Modeling**: Log-based stat curves
- **Guild Insights**: Cross-guild analysis and recommendations
- **Legendary Database**: Track all legendaries and their drop sources
- **One-off Items**: Track non-set dungeon/raid drops

### Data Expansion
- Add legendary items to admin data with drop sources
- Add non-set gear items that are important
- Track boss difficulty/requirements for recommendations

---

## Files to Create/Modify

### New Files
```
src/lib/insights/
  types.ts                    # Insight interfaces
  aggregator.ts               # Main analysis orchestrator
  engines/
    gear-level-engine.ts
    stat-cap-engine.ts
    set-bonus-engine.ts
    stat-priority-engine.ts
    gear-completeness-engine.ts
    warband-balance-engine.ts

src/components/insights/
  InsightCard.tsx
  InsightsList.tsx
  InsightsSummary.tsx
  WarbandInsightsPanel.tsx

src/routes/_protected/
  insights/
    index.tsx                 # Warband insights dashboard

convex/
  insights.ts                 # Queries and mutations
```

### Modified Files
```
convex/schema.ts              # Add insightConfig table, isTwoHanded field
src/components/character/
  CharacterHeader.tsx         # Add insights summary badge
  GearSlot.tsx               # Handle two-handed display
  GearListTable.tsx          # Add two-handed toggle
src/routes/_protected/
  characters/$characterId.tsx # Add insights panel
```

---

## Open Questions

1. **Insight Persistence**: Should insights be cached in the database, or always computed on-the-fly?
   - Recommendation: Compute on-the-fly initially, cache if performance becomes an issue

2. **Notification System**: Should users be notified when new critical insights appear?
   - Could add a badge to the nav when critical insights exist

3. **Guild Insights**: Should guild leaders see aggregated insights for all guild members?
   - This would help with raid planning and identifying weak spots

4. **Historical Tracking**: Should we track insight resolution over time?
   - Could show "improvements made this week" type metrics
