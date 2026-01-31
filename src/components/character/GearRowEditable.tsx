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
  onSave: (updates: Partial<GearPiece>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function GearRowEditable({
  gear,
  characterClass,
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
    })
  }

  return (
    <div className="space-y-4 p-4 bg-muted rounded-lg">
      <div className="font-semibold">{gear.slot}</div>

      <div className="space-y-2">
        <Label htmlFor="itemName">Item Name</Label>
        <Input
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="e.g. Helm of Valor"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ilvl">Item Level</Label>
          <Input
            id="ilvl"
            type="number"
            value={ilvl}
            onChange={(e) => setIlvl(e.target.value)}
            placeholder="e.g. 63"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quality">Quality</Label>
          <Select
            value={quality || NONE_VALUE}
            onValueChange={(v) =>
              setQuality(v === NONE_VALUE ? "" : (v as Quality))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="quality">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stat1">Secondary Stat 1</Label>
          <Select
            value={stat1 || NONE_VALUE}
            onValueChange={(v) =>
              setStat1(v === NONE_VALUE ? "" : (v as SecondaryStat))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="stat1">
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
          <Label htmlFor="stat2">Secondary Stat 2</Label>
          <Select
            value={stat2 || NONE_VALUE}
            onValueChange={(v) =>
              setStat2(v === NONE_VALUE ? "" : (v as SecondaryStat))
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id="stat2">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="setBonus">Set Bonus</Label>
          <Select
            value={setBonus || NONE_VALUE}
            onValueChange={(v) => setSetBonus(v === NONE_VALUE ? "" : v)}
            disabled={isSubmitting || !classSets}
          >
            <SelectTrigger id="setBonus">
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
          <Label htmlFor="legendary">Legendary</Label>
          <Input
            id="legendary"
            value={legendary}
            onChange={(e) => setLegendary(e.target.value)}
            placeholder="e.g. Gnomish Defender"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
