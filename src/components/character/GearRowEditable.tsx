import { useQuery } from "convex/react"
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
import type {
  ClassName,
  GearPiece,
  Quality,
  SecondaryStat,
} from "@/lib/character-constants"
import { QUALITY, SECONDARY_STATS } from "@/lib/character-constants"
import { api } from "../../../convex/_generated/api"

const NONE_VALUE = "__none__"

interface GearRowEditableProps {
  gear: GearPiece
  characterClass: ClassName
  allGear: GearPiece[]
  onSave: (updates: Partial<GearPiece>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function GearRowEditable({
  gear,
  characterClass,
  allGear,
  onSave,
  onCancel,
  isSubmitting,
}: GearRowEditableProps) {
  const classSets = useQuery(api.sets.listByClass, {
    className: characterClass,
  })
  const [itemName, setItemName] = useState(gear.itemName ?? "")
  const [ilvl, setIlvl] = useState(gear.ilvl?.toString() ?? "")
  const [stat1, setStat1] = useState<SecondaryStat | "">(
    gear.secondaryStats?.[0] ?? "",
  )
  const [stat2, setStat2] = useState<SecondaryStat | "">(
    gear.secondaryStats?.[1] ?? "",
  )
  const [setBonus, setSetBonus] = useState(gear.setBonus ?? "")
  const [legendary, setLegendary] = useState(gear.legendary ?? "")
  const [quality, setQuality] = useState<Quality | "">(gear.quality ?? "")
  const [twoHanded, setTwoHanded] = useState(gear.twoHanded ?? false)

  // Check if this is Off Hand and Main Hand is two-handed
  const mainHandGear = allGear.find((g) => g.slot === "Main Hand")
  const isOffHandDisabled = gear.slot === "Off Hand" && mainHandGear?.twoHanded

  const handleSave = () => {
    const secondaryStats: SecondaryStat[] = []
    if (stat1) secondaryStats.push(stat1)
    if (stat2) secondaryStats.push(stat2)

    onSave({
      itemName: itemName || undefined,
      ilvl: ilvl ? parseInt(ilvl, 10) : undefined,
      secondaryStats: secondaryStats.length > 0 ? secondaryStats : undefined,
      setBonus: setBonus || undefined,
      legendary: legendary || undefined,
      quality: quality || undefined,
      twoHanded: gear.slot === "Main Hand" ? twoHanded : undefined,
    })
  }

  return (
    <div className="space-y-4 p-3 sm:p-4 bg-muted rounded-lg">
      <div className="font-semibold text-sm sm:text-base">{gear.slot}</div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="itemName" className="text-xs sm:text-sm">
            Item Name
          </Label>
          {gear.slot === "Main Hand" && (
            <button
              type="button"
              onClick={() => setTwoHanded(!twoHanded)}
              disabled={isSubmitting}
              className={`text-xs sm:text-sm font-semibold transition-all duration-200 px-2 py-1 rounded ${
                twoHanded
                  ? "text-primary opacity-100"
                  : "text-muted-foreground opacity-40"
              } hover:opacity-100`}
            >
              2H
            </button>
          )}
        </div>
        <Input
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="e.g. Helm of Valor"
          disabled={isSubmitting || isOffHandDisabled}
          className="h-9"
        />
        {isOffHandDisabled && (
          <p className="text-xs text-muted-foreground italic">
            Off Hand is disabled (Main Hand is Two-Handed)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ilvl" className="text-xs sm:text-sm">
            Item Level
          </Label>
          <Input
            id="ilvl"
            type="number"
            value={ilvl}
            onChange={(e) => setIlvl(e.target.value)}
            placeholder="e.g. 63"
            disabled={isSubmitting || isOffHandDisabled}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quality" className="text-xs sm:text-sm">
            Quality
          </Label>
          <Select
            value={quality || NONE_VALUE}
            onValueChange={(v) =>
              setQuality(v === NONE_VALUE ? "" : (v as Quality))
            }
            disabled={isSubmitting || isOffHandDisabled}
          >
            <SelectTrigger id="quality" className="h-9">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>Auto (from ilvl)</SelectItem>
              {QUALITY.map((q) => (
                <SelectItem key={q} value={q}>
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stat1" className="text-xs sm:text-sm">
            Secondary Stat 1
          </Label>
          <Select
            value={stat1 || NONE_VALUE}
            onValueChange={(v) =>
              setStat1(v === NONE_VALUE ? "" : (v as SecondaryStat))
            }
            disabled={isSubmitting || isOffHandDisabled}
          >
            <SelectTrigger id="stat1" className="h-9">
              <SelectValue placeholder="None" />
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

        <div className="space-y-2">
          <Label htmlFor="stat2" className="text-xs sm:text-sm">
            Secondary Stat 2
          </Label>
          <Select
            value={stat2 || NONE_VALUE}
            onValueChange={(v) =>
              setStat2(v === NONE_VALUE ? "" : (v as SecondaryStat))
            }
            disabled={isSubmitting || isOffHandDisabled}
          >
            <SelectTrigger id="stat2" className="h-9">
              <SelectValue placeholder="None" />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="setBonus" className="text-xs sm:text-sm">
            Set Bonus
          </Label>
          <Select
            value={setBonus || NONE_VALUE}
            onValueChange={(v) => setSetBonus(v === NONE_VALUE ? "" : v)}
            disabled={isSubmitting || !classSets || isOffHandDisabled}
          >
            <SelectTrigger id="setBonus" className="h-9">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>None</SelectItem>
              {classSets?.map((set) => (
                <SelectItem key={set._id} value={set.name}>
                  {set.name} ({set.quality})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="legendary" className="text-xs sm:text-sm">
            Legendary
          </Label>
          <Input
            id="legendary"
            value={legendary}
            onChange={(e) => setLegendary(e.target.value)}
            placeholder="e.g. Gnomish Defender"
            disabled={isSubmitting || isOffHandDisabled}
            className="h-9"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
