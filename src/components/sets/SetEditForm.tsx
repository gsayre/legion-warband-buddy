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
  DROP_LOCATION_TYPE_LABELS,
  DROP_LOCATION_TYPES,
  type DropLocationType,
  type GearSetFormState,
  getMissingFields,
  isFieldMissing,
  QUALITY_LABELS,
  type SetBonus,
  type SetPiece,
} from "@/lib/sets-constants"
import { cn } from "@/lib/utils"

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

  const missingFields = getMissingFields(formState)

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
      bonuses: [...prev.bonuses, { pieces: 2, stat: "", value: 0 }],
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
                        onChange={(e) =>
                          updatePiece(idx, { name: e.target.value })
                        }
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
                  <div className="flex gap-2 items-start">
                    <div className="w-28">
                      <Select
                        value={piece.dropLocation?.type ?? ""}
                        onValueChange={(value) =>
                          updatePiece(idx, {
                            dropLocation: value
                              ? {
                                  type: value as DropLocationType,
                                  name: piece.dropLocation?.name ?? "",
                                  droppedBy: piece.dropLocation?.droppedBy,
                                }
                              : undefined,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                          {DROP_LOCATION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {DROP_LOCATION_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={piece.dropLocation?.name ?? ""}
                        onChange={(e) =>
                          updatePiece(idx, {
                            dropLocation: piece.dropLocation?.type
                              ? {
                                  ...piece.dropLocation,
                                  name: e.target.value,
                                }
                              : undefined,
                          })
                        }
                        placeholder="Location name"
                        className="h-8 text-xs"
                        disabled={!piece.dropLocation?.type}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={piece.dropLocation?.droppedBy ?? ""}
                        onChange={(e) =>
                          updatePiece(idx, {
                            dropLocation: piece.dropLocation?.type
                              ? {
                                  ...piece.dropLocation,
                                  droppedBy: e.target.value || undefined,
                                }
                              : undefined,
                          })
                        }
                        placeholder="Dropped by (boss name)"
                        className="h-8 text-xs"
                        disabled={!piece.dropLocation?.type}
                      />
                    </div>
                  </div>
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
                <div key={idx} className="flex gap-2 items-start">
                  {/* Pieces count */}
                  <div className="w-16">
                    <select
                      value={bonus.pieces}
                      onChange={(e) =>
                        updateBonus(idx, {
                          pieces: Number.parseInt(e.target.value, 10),
                        })
                      }
                      className={cn(
                        "h-8 w-full rounded-md border border-input bg-background px-2 text-xs",
                        isFieldMissing(
                          `bonuses[${idx}].pieces`,
                          missingFields,
                        ) && "border-red-500",
                      )}
                    >
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n}pc
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Stat select */}
                  <div className="w-28">
                    <Select
                      value={bonus.stat}
                      onValueChange={(value) =>
                        updateBonus(idx, { stat: value })
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 text-xs",
                          isFieldMissing(
                            `bonuses[${idx}].stat`,
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
                  {/* Value input */}
                  <div className="w-20">
                    <Input
                      type="number"
                      value={bonus.value}
                      onChange={(e) =>
                        updateBonus(idx, {
                          value: Number.parseInt(e.target.value, 10) || 0,
                        })
                      }
                      placeholder="Value"
                      className={cn(
                        "h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        isFieldMissing(
                          `bonuses[${idx}].value`,
                          missingFields,
                        ) && "border-red-500",
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBonus(idx)}
                    className="h-8 px-2"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
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
            <Button type="submit" size="sm" disabled={isSubmitting}>
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
