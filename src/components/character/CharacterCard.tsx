import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ClassName, GearPiece } from "@/lib/character-constants"
import {
  calculateAverageIlvl,
  getLegendaries,
  isStatCapped,
} from "@/lib/character-constants"
import { cn } from "@/lib/utils"

interface CharacterCardProps {
  id: string
  className: ClassName
  adventureGear: GearPiece[]
  dungeonGear: GearPiece[]
  hitPercent: number
  expertisePercent: number
  mode?: "adventure" | "dungeon"
}

export function CharacterCard({
  id,
  className,
  adventureGear,
  dungeonGear,
  hitPercent,
  expertisePercent,
  mode = "dungeon",
}: CharacterCardProps) {
  const gear = mode === "adventure" ? adventureGear : dungeonGear
  const avgIlvl = calculateAverageIlvl(gear)
  const legendaries = getLegendaries(gear)
  const hitCapped = isStatCapped("hit", hitPercent)
  const expertiseCapped = isStatCapped("expertise", expertisePercent)
  const equippedCount = gear.filter((g) => g.ilvl && g.ilvl > 0).length

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{className}</CardTitle>
          <div className="text-2xl font-bold text-primary">
            {avgIlvl > 0 ? avgIlvl.toFixed(0) : "-"}
          </div>
        </div>
        <CardDescription>{equippedCount}/16 slots equipped</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Stats row */}
          <div className="flex gap-4 text-sm">
            <div
              className={cn(
                "flex items-center gap-1",
                hitCapped ? "text-green-500" : "text-yellow-500",
              )}
            >
              <span className="text-muted-foreground">Hit:</span>
              <span className="font-semibold">{hitPercent.toFixed(1)}%</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1",
                expertiseCapped ? "text-green-500" : "text-yellow-500",
              )}
            >
              <span className="text-muted-foreground">Exp:</span>
              <span className="font-semibold">
                {expertisePercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Legendaries */}
          {legendaries.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {legendaries.slice(0, 3).map((item) => (
                <span
                  key={`${item.slot}-${item.legendary}`}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: "var(--quality-legendary)",
                    backgroundColor: "rgba(249, 115, 22, 0.1)",
                  }}
                >
                  {item.legendary}
                </span>
              ))}
              {legendaries.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{legendaries.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* View button */}
          <Link to="/characters/$characterId" params={{ characterId: id }}>
            <Button variant="outline" size="sm" className="w-full">
              View Character
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
