import { AlertTriangle, Check, Pencil, Plus, Trash2, X } from "lucide-react"
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
  QUALITY_COLORS,
  SET_QUALITY,
  type SetQuality,
  SLOTS,
} from "@/lib/character-constants"
import {
  BONUS_STATS,
  type GearSet,
  type GearSetFormState,
  getMissingFields,
  QUALITY_LABELS,
  setToFormState,
} from "@/lib/sets-constants"
import { DropLocationDisplay, DropLocationPicker } from "./DropLocationPicker"

interface SetCardProps {
  set: GearSet
  isAdmin: boolean
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: (state: GearSetFormState) => void
  isSubmitting: boolean
}

export function SetCard({
  set,
  isAdmin,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  isSubmitting,
}: SetCardProps) {
  const [formState, setFormState] = useState<GearSetFormState>(() =>
    setToFormState(set),
  )

  const missingFields = getMissingFields(
    isEditing ? formState : setToFormState(set),
  )
  const hasWarning = missingFields.length > 0

  function handleStartEdit() {
    setFormState(setToFormState(set))
    onStartEdit()
  }

  function handleSave() {
    onSave(formState)
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

  function updatePiece(
    index: number,
    updates: Partial<GearSetFormState["pieces"][0]>,
  ) {
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
          ? { ...b, stats: [...(b.stats || []), { stat: "", value: 0 }] }
          : b,
      ),
    }))
  }

  function updateStatInBonus(
    bonusIndex: number,
    statIndex: number,
    updates: Partial<NonNullable<GearSetFormState["bonuses"][0]["stats"]>[0]>,
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

  function updateBonus(
    index: number,
    updates: Partial<GearSetFormState["bonuses"][0]>,
  ) {
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

  const displayData = isEditing ? formState : set
  const qualityColor = displayData.quality
    ? QUALITY_COLORS[displayData.quality as SetQuality]
    : undefined

  return (
    <div className="group relative">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER: Set Name + Quality + Actions
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 mb-2">
        {hasWarning && (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        )}

        {isEditing ? (
          <Input
            value={formState.name}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Set name"
            className="h-7 text-sm font-bold px-2 py-0 w-36 bg-muted/50"
            style={{ color: qualityColor }}
          />
        ) : (
          <span
            className="font-bold text-sm tracking-wide"
            style={{ color: qualityColor }}
          >
            {set.name}
          </span>
        )}

        {/* Quality selector / badge */}
        {isEditing ? (
          <div className="flex gap-0.5 ml-1">
            {SET_QUALITY.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() =>
                  setFormState((prev) => ({ ...prev, quality: q }))
                }
                className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded transition-all font-semibold"
                style={{
                  color: QUALITY_COLORS[q],
                  opacity: formState.quality === q ? 1 : 0.35,
                  background:
                    formState.quality === q
                      ? "rgba(255,255,255,0.08)"
                      : "transparent",
                }}
              >
                {q.slice(0, 1)}
              </button>
            ))}
          </div>
        ) : (
          <span
            className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded"
            style={{
              color: qualityColor,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {QUALITY_LABELS[set.quality]}
          </span>
        )}

        {/* Admin actions */}
        {isAdmin && (
          <div className="ml-auto flex gap-1">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="p-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isSubmitting}
                  className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CLASSES SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-3">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-medium mb-1">
          Classes
        </div>
        {isEditing ? (
          <div className="flex flex-wrap gap-1">
            {CLASSES.map((className) => (
              <button
                key={className}
                type="button"
                onClick={() => toggleClass(className)}
                className="text-[10px] px-1.5 py-0.5 rounded transition-all font-medium"
                style={{
                  color: CLASS_COLORS[className],
                  opacity: formState.classes.includes(className) ? 1 : 0.3,
                  background: formState.classes.includes(className)
                    ? "rgba(255,255,255,0.08)"
                    : "transparent",
                }}
              >
                {className}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {set.classes.map((className) => (
              <span
                key={className}
                className="text-[10px] font-medium"
                style={{ color: CLASS_COLORS[className] }}
              >
                {className}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PIECES SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-medium">
            Pieces
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/20 to-transparent" />
          {!isEditing && (
            <span className="text-[9px] text-muted-foreground/50">
              {set.pieces.length} items
            </span>
          )}
        </div>

        <div className="space-y-1.5 pl-2 border-l border-muted-foreground/20">
          {(isEditing ? formState.pieces : set.pieces).map((piece, idx) => (
            <div key={idx}>
              {isEditing ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Input
                      value={piece.name}
                      onChange={(e) =>
                        updatePiece(idx, { name: e.target.value })
                      }
                      placeholder="Item name"
                      className="h-6 text-xs px-1.5 py-0 flex-1 bg-muted/30"
                    />
                    <Select
                      value={piece.slot}
                      onValueChange={(value) =>
                        updatePiece(idx, { slot: value })
                      }
                    >
                      <SelectTrigger className="h-6 w-24 text-xs px-1.5 bg-muted/30">
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
                    <button
                      type="button"
                      onClick={() => removePiece(idx)}
                      className="p-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {/* Drop location inputs */}
                  <div className="pl-2">
                    <DropLocationPicker
                      value={piece.dropLocation}
                      onChange={(dropLocation) =>
                        updatePiece(idx, { dropLocation })
                      }
                      compact
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-foreground/90">{piece.name}</span>
                    <span className="text-muted-foreground/50 text-[10px]">
                      {piece.slot}
                    </span>
                  </div>
                  {piece.dropLocation && (
                    <DropLocationDisplay dropLocation={piece.dropLocation} />
                  )}
                </div>
              )}
            </div>
          ))}

          {isEditing && (
            <button
              type="button"
              onClick={addPiece}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-0.5"
            >
              <Plus className="h-3 w-3" />
              <span>Add piece</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SET BONUSES SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-medium">
            Set Bonuses
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/20 to-transparent" />
        </div>

        <div className="space-y-1.5 pl-2 border-l border-primary/30">
          {(isEditing ? formState.bonuses : set.bonuses).map((bonus, idx) => (
            <div key={idx}>
              {isEditing ? (
                <div className="space-y-1">
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
                  <div className="space-y-1 pl-3 border-l border-muted-foreground/20">
                    {(bonus.stats || []).map((statEntry, statIdx) => (
                      <div key={statIdx} className="flex items-center gap-1">
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
              ) : (
                <div className="text-xs">
                  <span
                    className="font-bold text-[10px]"
                    style={{ color: "var(--quality-epic)" }}
                  >
                    ({bonus.pieces})
                  </span>{" "}
                  <span className="text-muted-foreground/80">
                    {[
                      ...(bonus.stats || []).map(
                        (s) => `+${s.value} ${s.stat}`,
                      ),
                      ...(bonus.specialBonus ? [bonus.specialBonus] : []),
                    ].join(", ") || "—"}
                  </span>
                </div>
              )}
            </div>
          ))}

          {isEditing && (
            <button
              type="button"
              onClick={addBonus}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-0.5"
            >
              <Plus className="h-3 w-3" />
              <span>Add bonus</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          REQUIRED LEVEL (if present)
          ═══════════════════════════════════════════════════════════════════ */}
      {(isEditing || set.requiredLevel) && (
        <div className="flex items-center gap-2 pt-2 border-t border-muted-foreground/10">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium">
            Req. Level
          </span>
          {isEditing ? (
            <Input
              type="number"
              min={1}
              value={formState.requiredLevel ?? ""}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  requiredLevel: e.target.value
                    ? Number.parseInt(e.target.value, 10)
                    : undefined,
                }))
              }
              placeholder="—"
              className="h-5 text-[10px] px-1.5 py-0 w-12 bg-muted/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <span className="text-xs text-muted-foreground/70">
              {set.requiredLevel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
