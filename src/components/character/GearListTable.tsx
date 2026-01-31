import { useQuery } from "convex/react"
import { Check, Pencil, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  ClassName,
  GearPiece,
  Quality,
  SecondaryStat,
  Slot,
} from "@/lib/character-constants"
import { QUALITY, SECONDARY_STATS } from "@/lib/character-constants"
import { cn } from "@/lib/utils"
import { api } from "../../../convex/_generated/api"

const NONE_VALUE = "__none__"

interface GearListTableProps {
  gear: GearPiece[]
  characterClass: ClassName
  onEdit: (slot: Slot, updates: Partial<GearPiece>) => Promise<void>
  isSubmitting?: boolean
}

// Display order per spec
const SLOT_ORDER: Slot[] = [
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
]

// Display labels - Belt shown as "Waist" per spec
const SLOT_DISPLAY_LABELS: Record<Slot, string> = {
  Head: "Head",
  Neck: "Neck",
  Shoulders: "Shoulders",
  Chest: "Chest",
  Back: "Back",
  Wrist: "Wrist",
  Gloves: "Gloves",
  "Main Hand": "Main Hand",
  "Off Hand": "Off Hand",
  Belt: "Waist",
  Pants: "Pants",
  Boots: "Boots",
  "Ring 1": "Ring 1",
  "Ring 2": "Ring 2",
  "Trinket 1": "Trinket 1",
  "Trinket 2": "Trinket 2",
}

interface EditingState {
  itemName: string
  ilvl: string
  stat1: SecondaryStat | ""
  stat2: SecondaryStat | ""
  setBonus: string
  legendary: string
  quality: Quality | ""
  twoHanded: boolean
}

// Mobile card component for screens < 640px
function MobileGearCard({
  gear,
  displayLabel,
  classSets,
  onEdit,
  isSubmitting,
  allGear,
}: {
  gear: GearPiece
  displayLabel: string
  classSets: { _id: string; name: string; quality: string }[] | undefined
  onEdit: (updates: Partial<GearPiece>) => Promise<void>
  isSubmitting?: boolean
  allGear: GearPiece[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editState, setEditState] = useState<EditingState>({
    itemName: "",
    ilvl: "",
    stat1: "",
    stat2: "",
    setBonus: "",
    legendary: "",
    quality: "",
    twoHanded: false,
  })

  const mainHandGear = allGear.find((g) => g.slot === "Main Hand")
  const isOffHandDisabled = gear.slot === "Off Hand" && mainHandGear?.twoHanded

  const qualityColor = gear.quality
    ? `var(--quality-${gear.quality})`
    : undefined

  const handleStartEdit = () => {
    setEditState({
      itemName: gear.itemName ?? "",
      ilvl: gear.ilvl?.toString() ?? "",
      stat1: gear.secondaryStats?.[0] ?? "",
      stat2: gear.secondaryStats?.[1] ?? "",
      setBonus: gear.setBonus ?? "",
      legendary: gear.legendary ?? "",
      quality: gear.quality ?? "",
      twoHanded: gear.twoHanded ?? false,
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    const secondaryStats: SecondaryStat[] = []
    if (editState.stat1) secondaryStats.push(editState.stat1)
    if (editState.stat2) secondaryStats.push(editState.stat2)

    await onEdit({
      itemName: editState.itemName || undefined,
      ilvl: editState.ilvl ? parseInt(editState.ilvl, 10) : undefined,
      secondaryStats: secondaryStats.length > 0 ? secondaryStats : undefined,
      setBonus: editState.setBonus || undefined,
      legendary: editState.legendary || undefined,
      quality: editState.quality || undefined,
      twoHanded: gear.slot === "Main Hand" ? editState.twoHanded : undefined,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="border rounded-lg p-3 bg-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{displayLabel}</h3>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Item Name</Label>
              {gear.slot === "Main Hand" && (
                <button
                  type="button"
                  onClick={() =>
                    setEditState({
                      ...editState,
                      twoHanded: !editState.twoHanded,
                    })
                  }
                  disabled={isSubmitting}
                  className={`text-xs font-semibold transition-all duration-200 px-2 py-1 rounded ${
                    editState.twoHanded
                      ? "text-primary opacity-100"
                      : "text-muted-foreground opacity-40"
                  } hover:opacity-100`}
                >
                  2H
                </button>
              )}
            </div>
            <Input
              value={editState.itemName}
              onChange={(e) =>
                setEditState({ ...editState, itemName: e.target.value })
              }
              placeholder="Item name"
              className="h-9 text-sm"
              disabled={isSubmitting || isOffHandDisabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">iLvl</Label>
              <Input
                type="number"
                value={editState.ilvl}
                onChange={(e) =>
                  setEditState({ ...editState, ilvl: e.target.value })
                }
                placeholder="63"
                className="h-9 text-sm"
                disabled={isSubmitting || isOffHandDisabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quality</Label>
              <Select
                value={editState.quality || NONE_VALUE}
                onValueChange={(v) =>
                  setEditState({
                    ...editState,
                    quality: v === NONE_VALUE ? "" : (v as Quality),
                  })
                }
                disabled={isSubmitting || isOffHandDisabled}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {QUALITY.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q.charAt(0).toUpperCase() + q.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Stat 1</Label>
              <Select
                value={editState.stat1 || NONE_VALUE}
                onValueChange={(v) =>
                  setEditState({
                    ...editState,
                    stat1: v === NONE_VALUE ? "" : (v as SecondaryStat),
                  })
                }
                disabled={isSubmitting || isOffHandDisabled}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {SECONDARY_STATS.map((stat) => (
                    <SelectItem key={stat} value={stat}>
                      {stat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stat 2</Label>
              <Select
                value={editState.stat2 || NONE_VALUE}
                onValueChange={(v) =>
                  setEditState({
                    ...editState,
                    stat2: v === NONE_VALUE ? "" : (v as SecondaryStat),
                  })
                }
                disabled={isSubmitting || isOffHandDisabled}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {SECONDARY_STATS.map((stat) => (
                    <SelectItem key={stat} value={stat}>
                      {stat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Set Bonus</Label>
            <Select
              value={editState.setBonus || NONE_VALUE}
              onValueChange={(v) =>
                setEditState({
                  ...editState,
                  setBonus: v === NONE_VALUE ? "" : v,
                })
              }
              disabled={isSubmitting || !classSets || isOffHandDisabled}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {classSets?.map((set) => (
                  <SelectItem key={set._id} value={set.name}>
                    {set.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Legendary</Label>
            <Input
              value={editState.legendary}
              onChange={(e) =>
                setEditState({ ...editState, legendary: e.target.value })
              }
              placeholder="Legendary"
              className="h-9 text-sm"
              disabled={isSubmitting || isOffHandDisabled}
            />
          </div>

          {isOffHandDisabled && (
            <p className="text-xs text-muted-foreground italic">
              (Main Hand is Two-Handed)
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    )
  }

  const stats = gear.secondaryStats || []

  return (
    <div
      className="border rounded-lg p-3 bg-card space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleStartEdit}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{displayLabel}</h3>
        <Pencil className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Item:</span>
          <div className="flex items-center gap-2">
            <span
              className={cn(!gear.itemName && "text-muted-foreground")}
              style={gear.itemName && qualityColor ? { color: qualityColor } : {}}
            >
              {gear.itemName || "-"}
            </span>
            {gear.slot === "Main Hand" && gear.twoHanded && (
              <span className="text-xs font-semibold text-primary">2H</span>
            )}
            {isOffHandDisabled && (
              <span className="text-xs text-muted-foreground italic">(2H)</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">iLvl:</span>
          <span style={qualityColor ? { color: qualityColor } : {}}>
            {gear.ilvl && gear.ilvl > 0 ? gear.ilvl : "-"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Quality:</span>
          <span style={qualityColor ? { color: qualityColor } : {}}>
            {gear.quality
              ? gear.quality.charAt(0).toUpperCase() + gear.quality.slice(1)
              : "-"}
          </span>
        </div>

        {(stats[0] || stats[1]) && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Stats:</span>
            <span className="text-muted-foreground">
              {stats[0] || "-"} / {stats[1] || "-"}
            </span>
          </div>
        )}

        {gear.setBonus && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Set:</span>
            <span>{gear.setBonus}</span>
          </div>
        )}

        {gear.legendary && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Legendary:</span>
            <span style={{ color: "var(--quality-legendary)" }}>
              {gear.legendary}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function GearRow({
  gear,
  displayLabel,
  classSets,
  onEdit,
  isSubmitting,
  allGear,
}: {
  gear: GearPiece
  displayLabel: string
  classSets: { _id: string; name: string; quality: string }[] | undefined
  onEdit: (updates: Partial<GearPiece>) => Promise<void>
  isSubmitting?: boolean
  allGear: GearPiece[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [editState, setEditState] = useState<EditingState>({
    itemName: "",
    ilvl: "",
    stat1: "",
    stat2: "",
    setBonus: "",
    legendary: "",
    quality: "",
    twoHanded: false,
  })

  // Check if this is Off Hand and Main Hand is two-handed
  const mainHandGear = allGear.find((g) => g.slot === "Main Hand")
  const isOffHandDisabled = gear.slot === "Off Hand" && mainHandGear?.twoHanded

  const qualityColor = gear.quality
    ? `var(--quality-${gear.quality})`
    : undefined

  const handleStartEdit = () => {
    setEditState({
      itemName: gear.itemName ?? "",
      ilvl: gear.ilvl?.toString() ?? "",
      stat1: gear.secondaryStats?.[0] ?? "",
      stat2: gear.secondaryStats?.[1] ?? "",
      setBonus: gear.setBonus ?? "",
      legendary: gear.legendary ?? "",
      quality: gear.quality ?? "",
      twoHanded: gear.twoHanded ?? false,
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    const secondaryStats: SecondaryStat[] = []
    if (editState.stat1) secondaryStats.push(editState.stat1)
    if (editState.stat2) secondaryStats.push(editState.stat2)

    await onEdit({
      itemName: editState.itemName || undefined,
      ilvl: editState.ilvl ? parseInt(editState.ilvl, 10) : undefined,
      secondaryStats: secondaryStats.length > 0 ? secondaryStats : undefined,
      setBonus: editState.setBonus || undefined,
      legendary: editState.legendary || undefined,
      quality: editState.quality || undefined,
      twoHanded: gear.slot === "Main Hand" ? editState.twoHanded : undefined,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <TableRow onKeyDown={handleKeyDown}>
        <TableCell className="font-medium">{displayLabel}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Input
              value={editState.itemName}
              onChange={(e) =>
                setEditState({ ...editState, itemName: e.target.value })
              }
              placeholder="Item name"
              className="h-8 text-sm"
              disabled={isSubmitting || isOffHandDisabled}
            />
            {gear.slot === "Main Hand" && (
              <button
                type="button"
                onClick={() =>
                  setEditState({
                    ...editState,
                    twoHanded: !editState.twoHanded,
                  })
                }
                disabled={isSubmitting}
                className={`text-xs font-semibold transition-all duration-200 px-2 py-1 rounded whitespace-nowrap ${
                  editState.twoHanded
                    ? "text-primary opacity-100"
                    : "text-muted-foreground opacity-40"
                } hover:opacity-100`}
              >
                2H
              </button>
            )}
            {isOffHandDisabled && (
              <span className="text-xs text-muted-foreground italic whitespace-nowrap">
                (2H)
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={editState.ilvl}
            onChange={(e) =>
              setEditState({ ...editState, ilvl: e.target.value })
            }
            placeholder="63"
            className="h-8 w-16 text-sm"
            disabled={isSubmitting || isOffHandDisabled}
          />
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <Select
            value={editState.quality || NONE_VALUE}
            onValueChange={(v) =>
              setEditState({
                ...editState,
                quality: v === NONE_VALUE ? "" : (v as Quality),
              })
            }
            disabled={isSubmitting || isOffHandDisabled}
          >
            <SelectTrigger className="h-8 w-24 text-sm">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {QUALITY.map((q) => (
                <SelectItem key={q} value={q}>
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Select
            value={editState.stat1 || NONE_VALUE}
            onValueChange={(v) =>
              setEditState({
                ...editState,
                stat1: v === NONE_VALUE ? "" : (v as SecondaryStat),
              })
            }
            disabled={isSubmitting || isOffHandDisabled}
          >
            <SelectTrigger className="h-8 w-24 text-sm">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {SECONDARY_STATS.map((stat) => (
                <SelectItem key={stat} value={stat}>
                  {stat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <Select
            value={editState.stat2 || NONE_VALUE}
            onValueChange={(v) =>
              setEditState({
                ...editState,
                stat2: v === NONE_VALUE ? "" : (v as SecondaryStat),
              })
            }
            disabled={isSubmitting || isOffHandDisabled}
          >
            <SelectTrigger className="h-8 w-24 text-sm">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {SECONDARY_STATS.map((stat) => (
                <SelectItem key={stat} value={stat}>
                  {stat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          <Select
            value={editState.setBonus || NONE_VALUE}
            onValueChange={(v) =>
              setEditState({
                ...editState,
                setBonus: v === NONE_VALUE ? "" : v,
              })
            }
            disabled={isSubmitting || !classSets || isOffHandDisabled}
          >
            <SelectTrigger className="h-8 w-28 text-sm">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {classSets?.map((set) => (
                <SelectItem key={set._id} value={set.name}>
                  {set.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <Input
            value={editState.legendary}
            onChange={(e) =>
              setEditState({ ...editState, legendary: e.target.value })
            }
            placeholder="Legendary"
            className="h-8 w-28 text-sm"
            disabled={isSubmitting || isOffHandDisabled}
          />
        </TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  const stats = gear.secondaryStats || []

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <TableCell className="font-medium">{displayLabel}</TableCell>
      <TableCell
        className={cn("text-sm", !gear.itemName && "text-muted-foreground")}
        style={gear.itemName && qualityColor ? { color: qualityColor } : {}}
      >
        <div className="flex items-center gap-2">
          <span>{gear.itemName || "-"}</span>
          {gear.slot === "Main Hand" && gear.twoHanded && (
            <span className="text-xs font-semibold text-primary">2H</span>
          )}
          {isOffHandDisabled && (
            <span className="text-xs text-muted-foreground italic">(2H)</span>
          )}
        </div>
      </TableCell>
      <TableCell style={qualityColor ? { color: qualityColor } : {}}>
        {gear.ilvl && gear.ilvl > 0 ? gear.ilvl : "-"}
      </TableCell>
      <TableCell
        className="text-sm hidden sm:table-cell"
        style={qualityColor ? { color: qualityColor } : {}}
      >
        {gear.quality
          ? gear.quality.charAt(0).toUpperCase() + gear.quality.slice(1)
          : "-"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
        {stats[0] || "-"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
        {stats[1] || "-"}
      </TableCell>
      <TableCell className="text-sm">{gear.setBonus || "-"}</TableCell>
      <TableCell
        className="text-sm hidden lg:table-cell"
        style={gear.legendary ? { color: "var(--quality-legendary)" } : {}}
      >
        {gear.legendary || "-"}
      </TableCell>
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-7 w-7 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0",
          )}
          onClick={handleStartEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function GearListTable({
  gear,
  characterClass,
  onEdit,
  isSubmitting,
}: GearListTableProps) {
  const classSets = useQuery(api.sets.listByClass, {
    className: characterClass,
  })

  const getGearBySlot = (slot: Slot): GearPiece => {
    return gear.find((g) => g.slot === slot) || { slot }
  }

  const handleEditSlot =
    (slot: Slot) => async (updates: Partial<GearPiece>) => {
      await onEdit(slot, updates)
    }

  return (
    <>
      {/* Mobile Card Layout (< 640px) */}
      <div className="sm:hidden space-y-2">
        {SLOT_ORDER.map((slot) => (
          <MobileGearCard
            key={slot}
            gear={getGearBySlot(slot)}
            displayLabel={SLOT_DISPLAY_LABELS[slot]}
            classSets={classSets}
            onEdit={handleEditSlot(slot)}
            isSubmitting={isSubmitting}
            allGear={gear}
          />
        ))}
      </div>

      {/* Desktop Table (>= 640px) */}
      <div className="hidden sm:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Slot</TableHead>
              <TableHead className="min-w-[150px]">Item Name</TableHead>
              <TableHead className="w-[70px]">iLvl</TableHead>
              <TableHead className="w-[100px] hidden sm:table-cell">Quality</TableHead>
              <TableHead className="w-[110px] hidden md:table-cell">Stat 1</TableHead>
              <TableHead className="w-[110px] hidden md:table-cell">Stat 2</TableHead>
              <TableHead className="w-[120px]">Set</TableHead>
              <TableHead className="w-[130px] hidden lg:table-cell">Legendary</TableHead>
              <TableHead className="w-[60px]">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SLOT_ORDER.map((slot) => (
              <GearRow
                key={slot}
                gear={getGearBySlot(slot)}
                displayLabel={SLOT_DISPLAY_LABELS[slot]}
                classSets={classSets}
                onEdit={handleEditSlot(slot)}
                isSubmitting={isSubmitting}
                allGear={gear}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
