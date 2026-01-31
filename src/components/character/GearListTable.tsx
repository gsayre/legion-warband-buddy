import { Check, Pencil, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  GearPiece,
  Quality,
  SecondaryStat,
  Slot,
} from "@/lib/character-constants"
import { getQualityFromIlvl, SECONDARY_STATS } from "@/lib/character-constants"
import { cn } from "@/lib/utils"

const NONE_VALUE = "__none__"

interface GearListTableProps {
  gear: GearPiece[]
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
}

function GearRow({
  gear,
  displayLabel,
  onEdit,
  isSubmitting,
}: {
  gear: GearPiece
  displayLabel: string
  onEdit: (updates: Partial<GearPiece>) => Promise<void>
  isSubmitting?: boolean
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
  })

  const quality = gear.quality || getQualityFromIlvl(gear.ilvl)
  const qualityColor =
    gear.ilvl && gear.ilvl > 0 ? `var(--quality-${quality})` : undefined

  const handleStartEdit = () => {
    setEditState({
      itemName: gear.itemName ?? "",
      ilvl: gear.ilvl?.toString() ?? "",
      stat1: gear.secondaryStats?.[0] ?? "",
      stat2: gear.secondaryStats?.[1] ?? "",
      setBonus: gear.setBonus ?? "",
      legendary: gear.legendary ?? "",
      quality: gear.quality ?? "",
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
          <Input
            value={editState.itemName}
            onChange={(e) =>
              setEditState({ ...editState, itemName: e.target.value })
            }
            placeholder="Item name"
            className="h-8 text-sm"
            disabled={isSubmitting}
          />
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
            disabled={isSubmitting}
          />
        </TableCell>
        <TableCell>
          <Select
            value={editState.stat1 || NONE_VALUE}
            onValueChange={(v) =>
              setEditState({
                ...editState,
                stat1: v === NONE_VALUE ? "" : (v as SecondaryStat),
              })
            }
            disabled={isSubmitting}
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
            value={editState.stat2 || NONE_VALUE}
            onValueChange={(v) =>
              setEditState({
                ...editState,
                stat2: v === NONE_VALUE ? "" : (v as SecondaryStat),
              })
            }
            disabled={isSubmitting}
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
          <Input
            value={editState.setBonus}
            onChange={(e) =>
              setEditState({ ...editState, setBonus: e.target.value })
            }
            placeholder="Set"
            className="h-8 w-24 text-sm"
            disabled={isSubmitting}
          />
        </TableCell>
        <TableCell>
          <Input
            value={editState.legendary}
            onChange={(e) =>
              setEditState({ ...editState, legendary: e.target.value })
            }
            placeholder="Legendary"
            className="h-8 w-28 text-sm"
            disabled={isSubmitting}
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
        {gear.itemName || "-"}
      </TableCell>
      <TableCell style={qualityColor ? { color: qualityColor } : {}}>
        {gear.ilvl && gear.ilvl > 0 ? gear.ilvl : "-"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {stats[0] || "-"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {stats[1] || "-"}
      </TableCell>
      <TableCell className="text-sm">{gear.setBonus || "-"}</TableCell>
      <TableCell
        className="text-sm"
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
  onEdit,
  isSubmitting,
}: GearListTableProps) {
  const getGearBySlot = (slot: Slot): GearPiece => {
    return gear.find((g) => g.slot === slot) || { slot }
  }

  const handleEditSlot =
    (slot: Slot) => async (updates: Partial<GearPiece>) => {
      await onEdit(slot, updates)
    }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Slot</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead className="w-16">iLvl</TableHead>
            <TableHead className="w-24">Stat 1</TableHead>
            <TableHead className="w-24">Stat 2</TableHead>
            <TableHead className="w-24">Set</TableHead>
            <TableHead className="w-28">Legendary</TableHead>
            <TableHead className="w-16">Edit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SLOT_ORDER.map((slot) => (
            <GearRow
              key={slot}
              gear={getGearBySlot(slot)}
              displayLabel={SLOT_DISPLAY_LABELS[slot]}
              onEdit={handleEditSlot(slot)}
              isSubmitting={isSubmitting}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
