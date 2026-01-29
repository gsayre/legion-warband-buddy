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
  GearPiece,
  Quality,
  SecondaryStat,
} from "@/lib/character-constants"
import { QUALITY, SECONDARY_STATS } from "@/lib/character-constants"

interface GearRowEditableProps {
  gear: GearPiece
  onSave: (updates: Partial<GearPiece>) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function GearRowEditable({
  gear,
  onSave,
  onCancel,
  isSubmitting,
}: GearRowEditableProps) {
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
            value={quality}
            onValueChange={(v) => setQuality(v as Quality | "")}
            disabled={isSubmitting}
          >
            <SelectTrigger id="quality">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Auto (from ilvl)</SelectItem>
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
            value={stat1}
            onValueChange={(v) => setStat1(v as SecondaryStat | "")}
            disabled={isSubmitting}
          >
            <SelectTrigger id="stat1">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
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
            value={stat2}
            onValueChange={(v) => setStat2(v as SecondaryStat | "")}
            disabled={isSubmitting}
          >
            <SelectTrigger id="stat2">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
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
          <Input
            id="setBonus"
            value={setBonus}
            onChange={(e) => setSetBonus(e.target.value)}
            placeholder="e.g. Valorous"
            disabled={isSubmitting}
          />
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
