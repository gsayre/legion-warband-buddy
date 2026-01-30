import { useQuery } from "convex/react"
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CLASS_COLORS,
  CLASSES,
  type ClassName,
  type Slot,
} from "@/lib/character-constants"
import { BONUS_STATS, type SetBonus } from "@/lib/sets-constants"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

// Slots that are typically part of tier sets (excluding duplicate slots and accessories)
const TIER_SET_SLOTS: Slot[] = [
  "Head",
  "Shoulders",
  "Chest",
  "Gloves",
  "Pants",
  "Boots",
  "Belt",
  "Wrist",
  "Back",
  "Neck",
  "Main Hand",
  "Off Hand",
  "Ring 1",
  "Trinket 1",
]

export interface SlotDrop {
  slot: string
  locationId: Id<"locations">
  bossId: Id<"bosses">
}

export interface DropPatternData {
  _id: Id<"setDropPatterns">
  _creationTime: number
  name: string
  slotDrops: SlotDrop[]
  defaultBonuses?: SetBonus[]
  createdAt: number
  updatedAt: number
}

interface DropPatternsSectionProps {
  patterns: DropPatternData[]
  isSubmitting: boolean
  onCreatePattern: (
    name: string,
    slotDrops: SlotDrop[],
    defaultBonuses?: SetBonus[],
  ) => void
  onUpdatePattern: (
    id: Id<"setDropPatterns">,
    name: string,
    slotDrops: SlotDrop[],
    defaultBonuses?: SetBonus[],
  ) => void
  onRemovePattern: (id: Id<"setDropPatterns">) => void
}

export function DropPatternsSection({
  patterns,
  isSubmitting,
  onCreatePattern,
  onUpdatePattern,
  onRemovePattern,
}: DropPatternsSectionProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<Id<"setDropPatterns"> | null>(null)

  return (
    <div className="space-y-4 mt-12">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Drop Patterns</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/30 to-transparent" />
        <span className="text-sm text-muted-foreground">
          {patterns.length} {patterns.length === 1 ? "pattern" : "patterns"}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Define which slots drop from which bosses. Assign a pattern to multiple
        sets to share drop locations.
      </p>

      {/* Patterns list */}
      <div className="space-y-3">
        {patterns.map((pattern) =>
          editingId === pattern._id ? (
            <DropPatternEditor
              key={pattern._id}
              pattern={pattern}
              isSubmitting={isSubmitting}
              onSave={(name, slotDrops, defaultBonuses) => {
                onUpdatePattern(pattern._id, name, slotDrops, defaultBonuses)
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <DropPatternCard
              key={pattern._id}
              pattern={pattern}
              isSubmitting={isSubmitting}
              onEdit={() => setEditingId(pattern._id)}
              onRemove={() => onRemovePattern(pattern._id)}
            />
          ),
        )}
      </div>

      {/* Create new pattern */}
      {isCreating ? (
        <DropPatternEditor
          isSubmitting={isSubmitting}
          onSave={(name, slotDrops, defaultBonuses) => {
            onCreatePattern(name, slotDrops, defaultBonuses)
            setIsCreating(false)
          }}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 w-full p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add new drop pattern</span>
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Drop Pattern Card (read-only view)
// ═══════════════════════════════════════════════════════════════════════════

interface DropPatternCardProps {
  pattern: DropPatternData
  isSubmitting: boolean
  onEdit: () => void
  onRemove: () => void
}

function DropPatternCard({
  pattern,
  isSubmitting,
  onEdit,
  onRemove,
}: DropPatternCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const locations = useQuery(api.locations.list)
  const allBosses = useQuery(api.locations.listAllBosses)

  // Build lookup maps
  const locationMap = new Map(locations?.map((l) => [l._id, l.name]) ?? [])
  const bossMap = new Map(allBosses?.map((b) => [b._id, b.name]) ?? [])

  return (
    <div className="rounded-lg border border-border/50 bg-card/30 p-4 group">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded hover:bg-muted text-muted-foreground"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        <span className="text-sm font-semibold flex-1">{pattern.name}</span>
        <span className="text-xs text-muted-foreground">
          {pattern.slotDrops.length} slots
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={isSubmitting}
          className="p-1 rounded hover:bg-red-500/10 text-red-400/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded slot mappings and bonuses */}
      {isExpanded && (
        <div className="mt-3 pl-7 space-y-3 border-l border-muted-foreground/20 ml-2">
          {/* Slot mappings */}
          <div className="space-y-1.5">
            {pattern.slotDrops.map((drop) => (
              <div key={drop.slot} className="text-xs text-foreground/80">
                <span className="font-medium">{drop.slot}</span>
                <span className="text-muted-foreground"> → </span>
                <span>
                  {locationMap.get(drop.locationId) ?? "..."} /{" "}
                  {bossMap.get(drop.bossId) ?? "..."}
                </span>
              </div>
            ))}
          </div>

          {/* Default bonuses */}
          {pattern.defaultBonuses && pattern.defaultBonuses.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                Default Bonuses
              </div>
              {pattern.defaultBonuses.map((bonus, idx) => (
                <div key={idx} className="text-xs space-y-0.5">
                  <div>
                    <span
                      className="font-bold text-[10px]"
                      style={{ color: "var(--quality-epic)" }}
                    >
                      ({bonus.pieces})
                    </span>{" "}
                    <span className="text-muted-foreground/80">
                      {bonus.specialBonus || "Set Bonus"}
                    </span>
                  </div>
                  {(bonus.stats || []).map((s, sIdx) => (
                    <div
                      key={sIdx}
                      className="pl-4 text-[10px] text-muted-foreground/70"
                    >
                      +{s.value} {s.stat}
                      {s.forClasses && s.forClasses.length > 0 && (
                        <span className="ml-1">
                          (
                          {s.forClasses.map((c, cIdx) => (
                            <span key={c} style={{ color: CLASS_COLORS[c] }}>
                              {c}
                              {cIdx < s.forClasses!.length - 1 ? ", " : ""}
                            </span>
                          ))}
                          )
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Drop Pattern Editor (create/edit form)
// ═══════════════════════════════════════════════════════════════════════════

interface DropPatternEditorProps {
  pattern?: DropPatternData
  isSubmitting: boolean
  onSave: (
    name: string,
    slotDrops: SlotDrop[],
    defaultBonuses?: SetBonus[],
  ) => void
  onCancel: () => void
}

function DropPatternEditor({
  pattern,
  isSubmitting,
  onSave,
  onCancel,
}: DropPatternEditorProps) {
  const [name, setName] = useState(pattern?.name ?? "")
  const [slotDrops, setSlotDrops] = useState<SlotDrop[]>(
    pattern?.slotDrops ?? [],
  )
  const [addingSlot, setAddingSlot] = useState(false)
  const [defaultBonuses, setDefaultBonuses] = useState<SetBonus[]>(
    pattern?.defaultBonuses ?? [],
  )

  const locations = useQuery(api.locations.list)
  const allBosses = useQuery(api.locations.listAllBosses)

  // Build lookup maps
  const locationMap = new Map(locations?.map((l) => [l._id, l.name]) ?? [])
  const bossMap = new Map(allBosses?.map((b) => [b._id, b]) ?? [])

  // Get bosses for a specific location
  function getBossesForLocation(locationId: Id<"locations">) {
    return allBosses?.filter((b) => b.locationId === locationId) ?? []
  }

  // Slots that haven't been added yet
  const availableSlots = TIER_SET_SLOTS.filter(
    (slot) => !slotDrops.some((d) => d.slot === slot),
  )

  function handleAddSlotDrop(
    slot: string,
    locationId: Id<"locations">,
    bossId: Id<"bosses">,
  ) {
    setSlotDrops([...slotDrops, { slot, locationId, bossId }])
    setAddingSlot(false)
  }

  function handleUpdateSlotDrop(
    index: number,
    locationId: Id<"locations">,
    bossId: Id<"bosses">,
  ) {
    const updated = [...slotDrops]
    updated[index] = { ...updated[index], locationId, bossId }
    setSlotDrops(updated)
  }

  function handleRemoveSlotDrop(index: number) {
    setSlotDrops(slotDrops.filter((_, i) => i !== index))
  }

  // Bonus manipulation functions
  function addBonus() {
    setDefaultBonuses([
      ...defaultBonuses,
      { pieces: 2, stats: [], specialBonus: "" },
    ])
  }

  function updateBonus(index: number, updates: Partial<SetBonus>) {
    setDefaultBonuses(
      defaultBonuses.map((b, i) => (i === index ? { ...b, ...updates } : b)),
    )
  }

  function removeBonus(index: number) {
    setDefaultBonuses(defaultBonuses.filter((_, i) => i !== index))
  }

  function addStatToBonus(bonusIndex: number) {
    setDefaultBonuses(
      defaultBonuses.map((b, i) =>
        i === bonusIndex
          ? { ...b, stats: [...(b.stats || []), { stat: "", value: 0 }] }
          : b,
      ),
    )
  }

  function updateStatInBonus(
    bonusIndex: number,
    statIndex: number,
    updates: Partial<{ stat: string; value: number; forClasses: ClassName[] }>,
  ) {
    setDefaultBonuses(
      defaultBonuses.map((b, i) =>
        i === bonusIndex
          ? {
              ...b,
              stats: (b.stats || []).map((s, j) =>
                j === statIndex ? { ...s, ...updates } : s,
              ),
            }
          : b,
      ),
    )
  }

  function toggleClassForStat(
    bonusIndex: number,
    statIndex: number,
    className: ClassName,
  ) {
    setDefaultBonuses(
      defaultBonuses.map((b, i) => {
        if (i !== bonusIndex) return b
        return {
          ...b,
          stats: (b.stats || []).map((s, j) => {
            if (j !== statIndex) return s
            const currentClasses = s.forClasses || []
            const hasClass = currentClasses.includes(className)
            const newClasses = hasClass
              ? currentClasses.filter((c) => c !== className)
              : [...currentClasses, className]
            // If no classes selected, remove the forClasses field (applies to all)
            return newClasses.length > 0
              ? { ...s, forClasses: newClasses }
              : { stat: s.stat, value: s.value }
          }),
        }
      }),
    )
  }

  function removeStatFromBonus(bonusIndex: number, statIndex: number) {
    setDefaultBonuses(
      defaultBonuses.map((b, i) =>
        i === bonusIndex
          ? { ...b, stats: (b.stats || []).filter((_, j) => j !== statIndex) }
          : b,
      ),
    )
  }

  function handleSave() {
    if (name.trim() && slotDrops.length > 0) {
      // Only include bonuses if there are any with valid data
      const validBonuses = defaultBonuses.filter(
        (b) => (b.stats && b.stats.length > 0) || b.specialBonus?.trim(),
      )
      onSave(
        name.trim(),
        slotDrops,
        validBonuses.length > 0 ? validBonuses : undefined,
      )
    }
  }

  const canSave = name.trim() && slotDrops.length > 0

  return (
    <div className="rounded-lg border border-primary/30 bg-card/50 p-4 space-y-4">
      {/* Pattern name */}
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Pattern name (e.g., MC Tier 1)"
          className="h-8 text-sm flex-1"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || !canSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-medium transition-colors disabled:opacity-30"
        >
          <Check className="h-4 w-4" />
          <span>Save</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
        >
          <X className="h-4 w-4" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Slot mappings */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
          Slot Mappings
        </div>

        {slotDrops.length === 0 && !addingSlot ? (
          <div className="text-xs text-muted-foreground/50 italic">
            No slot mappings added yet
          </div>
        ) : (
          <div className="space-y-2">
            {slotDrops.map((drop, index) => (
              <SlotDropRow
                key={drop.slot}
                drop={drop}
                locations={locations ?? []}
                getBossesForLocation={getBossesForLocation}
                locationMap={locationMap}
                bossMap={bossMap}
                onUpdate={(locationId, bossId) =>
                  handleUpdateSlotDrop(index, locationId, bossId)
                }
                onRemove={() => handleRemoveSlotDrop(index)}
              />
            ))}
          </div>
        )}

        {/* Add new slot mapping */}
        {addingSlot ? (
          <NewSlotDropRow
            availableSlots={availableSlots}
            locations={locations ?? []}
            getBossesForLocation={getBossesForLocation}
            onAdd={handleAddSlotDrop}
            onCancel={() => setAddingSlot(false)}
          />
        ) : availableSlots.length > 0 ? (
          <button
            type="button"
            onClick={() => setAddingSlot(true)}
            className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add slot mapping</span>
          </button>
        ) : null}
      </div>

      {/* Default bonuses */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
          Default Set Bonuses
        </div>

        <div className="space-y-2 pl-2 border-l border-primary/30">
          {defaultBonuses.map((bonus, idx) => (
            <div key={idx} className="space-y-1">
              {/* Header: pieces count + delete */}
              <div className="flex items-center gap-1">
                <div className="flex items-center">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--quality-epic)" }}
                  >
                    (
                  </span>
                  <select
                    value={bonus.pieces}
                    onChange={(e) =>
                      updateBonus(idx, {
                        pieces: Number.parseInt(e.target.value, 10),
                      })
                    }
                    className="h-5 w-8 text-xs text-center bg-transparent border-none outline-none font-medium"
                    style={{ color: "var(--quality-epic)" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--quality-epic)" }}
                  >
                    )
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground/50 flex-1">
                  Set Bonus
                </span>
                <button
                  type="button"
                  onClick={() => removeBonus(idx)}
                  className="p-0.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Stat entries */}
              <div className="space-y-2 pl-3 border-l border-muted-foreground/20">
                {(bonus.stats || []).map((statEntry, statIdx) => (
                  <div key={statIdx} className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Select
                        value={statEntry.stat}
                        onValueChange={(value) =>
                          updateStatInBonus(idx, statIdx, { stat: value })
                        }
                      >
                        <SelectTrigger className="h-5 w-20 text-[10px] px-1 bg-muted/30">
                          <SelectValue placeholder="Stat" />
                        </SelectTrigger>
                        <SelectContent>
                          {BONUS_STATS.map((stat) => (
                            <SelectItem key={stat} value={stat}>
                              {stat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-[9px] text-muted-foreground">
                        +
                      </span>
                      <Input
                        type="number"
                        value={statEntry.value}
                        onChange={(e) =>
                          updateStatInBonus(idx, statIdx, {
                            value: Number.parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="h-5 text-[10px] px-1 py-0 w-10 bg-muted/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeStatFromBonus(idx, statIdx)}
                        className="p-0.5 text-red-400/50 hover:text-red-400 rounded transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    {/* Class selector for this stat */}
                    <div className="flex items-center gap-0.5 pl-1">
                      <span className="text-[8px] text-muted-foreground/50 mr-1">
                        {statEntry.forClasses?.length ? "For:" : "All classes"}
                      </span>
                      {CLASSES.map((className) => {
                        const isSelected =
                          statEntry.forClasses?.includes(className) ?? false
                        return (
                          <button
                            key={className}
                            type="button"
                            onClick={() =>
                              toggleClassForStat(idx, statIdx, className)
                            }
                            className="text-[8px] px-1 py-0.5 rounded transition-all font-medium"
                            style={{
                              color: CLASS_COLORS[className],
                              opacity: isSelected ? 1 : 0.25,
                              background: isSelected
                                ? "rgba(255,255,255,0.08)"
                                : "transparent",
                            }}
                          >
                            {className.slice(0, 3)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addStatToBonus(idx)}
                  className="flex items-center gap-0.5 text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>Stat</span>
                </button>

                {/* Special bonus input */}
                <Input
                  value={bonus.specialBonus || ""}
                  onChange={(e) =>
                    updateBonus(idx, { specialBonus: e.target.value })
                  }
                  placeholder="Special effect..."
                  className="h-5 text-[9px] px-1 py-0 bg-muted/30 mt-1"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addBonus}
            className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-0.5"
          >
            <Plus className="h-3 w-3" />
            <span>Add bonus</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Slot Drop Row (existing mapping)
// ═══════════════════════════════════════════════════════════════════════════

interface SlotDropRowProps {
  drop: SlotDrop
  locations: Array<{ _id: Id<"locations">; name: string }>
  getBossesForLocation: (locationId: Id<"locations">) => Array<{
    _id: Id<"bosses">
    name: string
    locationId: Id<"locations">
  }>
  locationMap: Map<Id<"locations">, string>
  bossMap: Map<
    Id<"bosses">,
    { _id: Id<"bosses">; name: string; locationId: Id<"locations"> }
  >
  onUpdate: (locationId: Id<"locations">, bossId: Id<"bosses">) => void
  onRemove: () => void
}

function SlotDropRow({
  drop,
  locations,
  getBossesForLocation,
  onUpdate,
  onRemove,
}: SlotDropRowProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<
    Id<"locations"> | ""
  >(drop.locationId)
  const [selectedBossId, setSelectedBossId] = useState<Id<"bosses"> | "">(
    drop.bossId,
  )

  const bossesForLocation = selectedLocationId
    ? getBossesForLocation(selectedLocationId)
    : []

  function handleLocationChange(locationId: Id<"locations">) {
    setSelectedLocationId(locationId)
    setSelectedBossId("")
  }

  function handleBossChange(bossId: Id<"bosses">) {
    setSelectedBossId(bossId)
    if (selectedLocationId) {
      onUpdate(selectedLocationId, bossId)
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 font-medium text-foreground/80">{drop.slot}</span>
      <select
        value={selectedLocationId}
        onChange={(e) =>
          handleLocationChange(e.target.value as Id<"locations">)
        }
        className="flex-1 h-7 px-2 rounded border border-border/50 bg-background/50 text-xs"
      >
        <option value="">Select location...</option>
        {locations.map((loc) => (
          <option key={loc._id} value={loc._id}>
            {loc.name}
          </option>
        ))}
      </select>
      <select
        value={selectedBossId}
        onChange={(e) => handleBossChange(e.target.value as Id<"bosses">)}
        disabled={!selectedLocationId}
        className="flex-1 h-7 px-2 rounded border border-border/50 bg-background/50 text-xs disabled:opacity-50"
      >
        <option value="">Select boss...</option>
        {bossesForLocation.map((boss) => (
          <option key={boss._id} value={boss._id}>
            {boss.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// New Slot Drop Row (adding new mapping)
// ═══════════════════════════════════════════════════════════════════════════

interface NewSlotDropRowProps {
  availableSlots: Slot[]
  locations: Array<{ _id: Id<"locations">; name: string }>
  getBossesForLocation: (locationId: Id<"locations">) => Array<{
    _id: Id<"bosses">
    name: string
    locationId: Id<"locations">
  }>
  onAdd: (
    slot: string,
    locationId: Id<"locations">,
    bossId: Id<"bosses">,
  ) => void
  onCancel: () => void
}

function NewSlotDropRow({
  availableSlots,
  locations,
  getBossesForLocation,
  onAdd,
  onCancel,
}: NewSlotDropRowProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [selectedLocationId, setSelectedLocationId] = useState<
    Id<"locations"> | ""
  >("")
  const [selectedBossId, setSelectedBossId] = useState<Id<"bosses"> | "">("")

  const bossesForLocation = selectedLocationId
    ? getBossesForLocation(selectedLocationId)
    : []

  function handleLocationChange(locationId: Id<"locations">) {
    setSelectedLocationId(locationId)
    setSelectedBossId("")
  }

  function handleAdd() {
    if (selectedSlot && selectedLocationId && selectedBossId) {
      onAdd(selectedSlot, selectedLocationId, selectedBossId)
    }
  }

  const canAdd = selectedSlot && selectedLocationId && selectedBossId

  return (
    <div className="flex items-center gap-2 text-xs">
      <select
        value={selectedSlot}
        onChange={(e) => setSelectedSlot(e.target.value)}
        className="w-24 h-7 px-2 rounded border border-border/50 bg-background/50 text-xs"
      >
        <option value="">Slot...</option>
        {availableSlots.map((slot) => (
          <option key={slot} value={slot}>
            {slot}
          </option>
        ))}
      </select>
      <select
        value={selectedLocationId}
        onChange={(e) =>
          handleLocationChange(e.target.value as Id<"locations">)
        }
        className="flex-1 h-7 px-2 rounded border border-border/50 bg-background/50 text-xs"
      >
        <option value="">Select location...</option>
        {locations.map((loc) => (
          <option key={loc._id} value={loc._id}>
            {loc.name}
          </option>
        ))}
      </select>
      <select
        value={selectedBossId}
        onChange={(e) => setSelectedBossId(e.target.value as Id<"bosses">)}
        disabled={!selectedLocationId}
        className="flex-1 h-7 px-2 rounded border border-border/50 bg-background/50 text-xs disabled:opacity-50"
      >
        <option value="">Select boss...</option>
        {bossesForLocation.map((boss) => (
          <option key={boss._id} value={boss._id}>
            {boss.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className="p-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors disabled:opacity-30"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
