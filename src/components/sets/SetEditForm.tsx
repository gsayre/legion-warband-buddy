import { useQuery } from "convex/react"
import { AlertTriangle, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CLASSES,
  type ClassName,
  QUALITY_COLORS,
  SET_QUALITY,
  SLOTS,
} from "@/lib/character-constants"
import {
  BONUS_STATS,
  createEmptySetFormState,
  type GearSetFormState,
  getMissingFields,
  inferSlotFromName,
  isFieldMissing,
  QUALITY_LABELS,
  type SetBonus,
  type SetPiece,
  usesStructuredLocations,
} from "@/lib/sets-constants"
import { cn } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"
import { DropLocationPicker } from "./DropLocationPicker"

interface SetEditFormProps {
  initialState?: GearSetFormState
  onSave: (state: GearSetFormState) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function SetEditForm({
  initialState,
  onSave,
  onCancel,
  isSubmitting,
}: SetEditFormProps) {
  const [formState, setFormState] = useState<GearSetFormState>(
    initialState ?? createEmptySetFormState(),
  )

  // Fetch drop patterns for the selector
  const dropPatterns = useQuery(api.locations.listDropPatterns)

  // Fetch locations to look up types when applying drop patterns
  const locations = useQuery(api.locations.list)

  const missingFields = getMissingFields(formState)

  // Check if any piece is in an incomplete editing state
  function isPieceIncomplete(piece: SetPiece): boolean {
    // Piece with no slot or name is incomplete
    if (!piece.slot || !piece.name) return true

    // Check drop location if present
    const drop = piece.dropLocation
    if (drop?.type) {
      if (usesStructuredLocations(drop.type)) {
        // Structured: need locationId and bossId
        if (!drop.locationId || !drop.bossId) return true
      } else {
        // Freeform: need name
        if (!drop.name) return true
      }
    }

    return false
  }

  const hasIncompletePieces = formState.pieces.some(isPieceIncomplete)

  function updateField<K extends keyof GearSetFormState>(
    key: K,
    value: GearSetFormState[K],
  ) {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  function toggleClass(className: ClassName) {
    setFormState((prev) => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter((c) => c !== className)
        : [...prev.classes, className],
    }))
  }

  function addPiece() {
    setFormState((prev) => ({
      ...prev,
      pieces: [...prev.pieces, { slot: "", name: "" }],
    }))
  }

  function updatePiece(index: number, updates: Partial<SetPiece>) {
    setFormState((prev) => ({
      ...prev,
      pieces: prev.pieces.map((p, i) =>
        i === index ? { ...p, ...updates } : p,
      ),
    }))
  }

  function removePiece(index: number) {
    setFormState((prev) => ({
      ...prev,
      pieces: prev.pieces.filter((_, i) => i !== index),
    }))
  }

  function addBonus() {
    setFormState((prev) => ({
      ...prev,
      bonuses: [...prev.bonuses, { pieces: 2, stats: [], specialBonus: "" }],
    }))
  }

  function addStatToBonus(bonusIndex: number) {
    setFormState((prev) => ({
      ...prev,
      bonuses: prev.bonuses.map((b, i) =>
        i === bonusIndex
          ? {
              ...b,
              stats: [...(b.stats || []), { stat: "", value: Number.NaN }],
            }
          : b,
      ),
    }))
  }

  function updateStatInBonus(
    bonusIndex: number,
    statIndex: number,
    updates: Partial<NonNullable<SetBonus["stats"]>[0]>,
  ) {
    setFormState((prev) => ({
      ...prev,
      bonuses: prev.bonuses.map((b, i) =>
        i === bonusIndex
          ? {
              ...b,
              stats: (b.stats || []).map((s, j) =>
                j === statIndex ? { ...s, ...updates } : s,
              ),
            }
          : b,
      ),
    }))
  }

  function removeStatFromBonus(bonusIndex: number, statIndex: number) {
    setFormState((prev) => ({
      ...prev,
      bonuses: prev.bonuses.map((b, i) =>
        i === bonusIndex
          ? { ...b, stats: (b.stats || []).filter((_, j) => j !== statIndex) }
          : b,
      ),
    }))
  }

  function updateBonus(index: number, updates: Partial<SetBonus>) {
    setFormState((prev) => ({
      ...prev,
      bonuses: prev.bonuses.map((b, i) =>
        i === index ? { ...b, ...updates } : b,
      ),
    }))
  }

  function removeBonus(index: number) {
    setFormState((prev) => ({
      ...prev,
      bonuses: prev.bonuses.filter((_, i) => i !== index),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(formState)
  }

  return (
    <Card className="border-primary/50">
      <CardHeader className="pb-4 pt-4">
        <CardTitle className="text-sm">
          {initialState ? "Edit Set" : "New Set"}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 pb-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label
              className={cn(
                isFieldMissing("name", missingFields) && "text-red-500",
              )}
            >
              Set Name
              {isFieldMissing("name", missingFields) && (
                <AlertTriangle className="inline ml-1 h-3 w-3" />
              )}
            </Label>
            <Input
              value={formState.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., Valorous"
              className={cn(
                isFieldMissing("name", missingFields) && "border-red-500",
              )}
            />
          </div>

          {/* Quality */}
          <div className="space-y-1">
            <Label
              className={cn(
                isFieldMissing("quality", missingFields) && "text-red-500",
              )}
            >
              Quality
              {isFieldMissing("quality", missingFields) && (
                <AlertTriangle className="inline ml-1 h-3 w-3" />
              )}
            </Label>
            <div
              className={cn(
                "flex gap-2 p-2 rounded border",
                isFieldMissing("quality", missingFields) && "border-red-500",
              )}
            >
              {SET_QUALITY.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => updateField("quality", q)}
                  className="text-xs px-2 py-1 rounded transition-opacity"
                  style={{
                    color: QUALITY_COLORS[q],
                    opacity: formState.quality === q ? 1 : 0.3,
                  }}
                >
                  {QUALITY_LABELS[q]}
                </button>
              ))}
            </div>
          </div>

          {/* Classes */}
          <div className="space-y-1">
            <Label
              className={cn(
                isFieldMissing("classes", missingFields) && "text-red-500",
              )}
            >
              Classes
              {isFieldMissing("classes", missingFields) && (
                <AlertTriangle className="inline ml-1 h-3 w-3" />
              )}
            </Label>
            <div
              className={cn(
                "flex flex-wrap gap-2 p-2 rounded border",
                isFieldMissing("classes", missingFields) && "border-red-500",
              )}
            >
              {CLASSES.map((className) => (
                <button
                  key={className}
                  type="button"
                  onClick={() => toggleClass(className)}
                  className={cn(
                    "text-xs px-2 py-1 rounded transition-colors",
                    formState.classes.includes(className)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {className}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Pattern */}
          <div className="space-y-1">
            <Label>Drop Pattern (optional)</Label>
            <Select
              value={formState.dropPatternId ?? "none"}
              onValueChange={(value) => {
                const patternId = value === "none" ? undefined : value

                // Update the dropPatternId
                setFormState((prev) => {
                  // If selecting a pattern, pre-populate pieces from its slotDrops
                  if (patternId && dropPatterns && locations) {
                    const pattern = dropPatterns.find(
                      (p) => p._id === patternId,
                    )
                    if (pattern) {
                      // Build a map of locationId -> location type
                      const locationTypeMap = new Map(
                        locations.map((l) => [l._id, l.type]),
                      )

                      // Create pieces from the pattern's slotDrops
                      const newPieces: SetPiece[] = pattern.slotDrops.map(
                        (slotDrop) => {
                          const locationType = locationTypeMap.get(
                            slotDrop.locationId,
                          )
                          return {
                            slot: slotDrop.slot,
                            name: "",
                            dropLocation: {
                              type: locationType ?? "dungeon",
                              locationId: slotDrop.locationId,
                              bossId: slotDrop.bossId,
                            },
                          }
                        },
                      )

                      return {
                        ...prev,
                        dropPatternId: patternId,
                        pieces: newPieces,
                      }
                    }
                  }

                  return { ...prev, dropPatternId: patternId }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select drop pattern..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">
                    No pattern (manual entry)
                  </span>
                </SelectItem>
                {dropPatterns?.map((pattern) => (
                  <SelectItem key={pattern._id} value={pattern._id}>
                    {pattern.name} ({pattern.slotDrops.length} slots)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formState.dropPatternId && (
              <p className="text-xs text-muted-foreground">
                Piece drop locations will be inherited from this pattern.
              </p>
            )}
          </div>

          {/* Pieces */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  isFieldMissing("pieces", missingFields) && "text-red-500",
                )}
              >
                Pieces
                {isFieldMissing("pieces", missingFields) && (
                  <AlertTriangle className="inline ml-1 h-3 w-3" />
                )}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addPiece}
                className="h-6 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div
              className={cn(
                "space-y-2 p-2 rounded border",
                isFieldMissing("pieces", missingFields) && "border-red-500",
              )}
            >
              {formState.pieces.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  No pieces added yet
                </div>
              )}
              {formState.pieces.map((piece, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded border bg-muted/30 space-y-2"
                >
                  {/* Row 1: Slot, Name, Delete */}
                  <div className="flex gap-2 items-start">
                    <div className="w-28">
                      <Select
                        value={piece.slot}
                        onValueChange={(value) =>
                          updatePiece(idx, { slot: value })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            "h-8 text-xs",
                            isFieldMissing(
                              `pieces[${idx}].slot`,
                              missingFields,
                            ) && "border-red-500",
                          )}
                        >
                          <SelectValue placeholder="Slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {SLOTS.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={piece.name}
                        onChange={(e) => {
                          const newName = e.target.value
                          const updates: Partial<SetPiece> = { name: newName }

                          // Auto-infer slot if not already set
                          if (!piece.slot) {
                            const inferredSlot = inferSlotFromName(newName)
                            if (inferredSlot) {
                              updates.slot = inferredSlot
                            }
                          }

                          updatePiece(idx, updates)
                        }}
                        placeholder="Item Name"
                        className={cn(
                          "h-8 text-xs",
                          isFieldMissing(
                            `pieces[${idx}].name`,
                            missingFields,
                          ) && "border-red-500",
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePiece(idx)}
                      className="h-8 px-2"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  {/* Row 2: Drop Location */}
                  <DropLocationPicker
                    value={piece.dropLocation}
                    onChange={(dropLocation) =>
                      updatePiece(idx, { dropLocation })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bonuses */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label
                className={cn(
                  isFieldMissing("bonuses", missingFields) && "text-red-500",
                )}
              >
                Set Bonuses
                {isFieldMissing("bonuses", missingFields) && (
                  <AlertTriangle className="inline ml-1 h-3 w-3" />
                )}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addBonus}
                className="h-6 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div
              className={cn(
                "space-y-2 p-2 rounded border",
                isFieldMissing("bonuses", missingFields) && "border-red-500",
              )}
            >
              {formState.bonuses.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  No bonuses added yet
                </div>
              )}
              {formState.bonuses.map((bonus, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded border bg-muted/30 space-y-2"
                >
                  {/* Header row: pieces count + delete bonus */}
                  <div className="flex items-center gap-2">
                    <div className="w-16">
                      <select
                        value={bonus.pieces}
                        onChange={(e) =>
                          updateBonus(idx, {
                            pieces: Number.parseInt(e.target.value, 10),
                          })
                        }
                        className={cn(
                          "h-7 w-full rounded-md border border-input bg-background px-2 text-xs",
                          isFieldMissing(
                            `bonuses[${idx}].pieces`,
                            missingFields,
                          ) && "border-red-500",
                        )}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {n}pc
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-xs text-muted-foreground flex-1">
                      Set Bonus
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBonus(idx)}
                      className="h-6 px-2"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>

                  {/* Stat entries */}
                  <div
                    className={cn(
                      "space-y-1 pl-2 border-l-2 border-primary/30",
                      isFieldMissing(
                        `bonuses[${idx}].content`,
                        missingFields,
                      ) && "border-red-500",
                    )}
                  >
                    {(bonus.stats || []).map((statEntry, statIdx) => (
                      <div key={statIdx} className="flex gap-2 items-center">
                        <div className="w-28">
                          <Select
                            value={statEntry.stat}
                            onValueChange={(value) =>
                              updateStatInBonus(idx, statIdx, { stat: value })
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                "h-7 text-xs",
                                isFieldMissing(
                                  `bonuses[${idx}].stats[${statIdx}].stat`,
                                  missingFields,
                                ) && "border-red-500",
                              )}
                            >
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
                        </div>
                        <Input
                          type="number"
                          value={
                            Number.isNaN(statEntry.value) ? "" : statEntry.value
                          }
                          onChange={(e) =>
                            updateStatInBonus(idx, statIdx, {
                              value:
                                e.target.value === ""
                                  ? Number.NaN
                                  : Number.parseInt(e.target.value, 10),
                            })
                          }
                          placeholder="Value"
                          className={cn(
                            "h-7 w-16 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                            isFieldMissing(
                              `bonuses[${idx}].stats[${statIdx}].value`,
                              missingFields,
                            ) && "border-red-500",
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStatFromBonus(idx, statIdx)}
                          className="h-6 px-1"
                        >
                          <Trash2 className="h-2.5 w-2.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addStatToBonus(idx)}
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Stat
                    </Button>

                    {/* Special bonus input */}
                    <div className="pt-1">
                      <Input
                        value={bonus.specialBonus || ""}
                        onChange={(e) =>
                          updateBonus(idx, { specialBonus: e.target.value })
                        }
                        placeholder="Special effect (e.g., '10% chance to reflect damage on block')"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required Level (optional) */}
          <div className="space-y-1">
            <Label>Required Level (optional)</Label>
            <Input
              type="number"
              min={1}
              value={formState.requiredLevel ?? ""}
              onChange={(e) =>
                updateField(
                  "requiredLevel",
                  e.target.value
                    ? Number.parseInt(e.target.value, 10)
                    : undefined,
                )
              }
              placeholder="e.g., 60"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || hasIncompletePieces}
              title={
                hasIncompletePieces
                  ? "Complete all pieces before saving"
                  : undefined
              }
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
