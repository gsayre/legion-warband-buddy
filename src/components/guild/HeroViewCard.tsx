import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Doc } from "../../../convex/_generated/dataModel"

interface HeroViewCardProps {
  hero: Doc<"heroes">
}

export function HeroViewCard({ hero }: HeroViewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{hero.name}</CardTitle>
        <CardDescription>
          Level {hero.level} {hero.class}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-muted-foreground">Health</div>
            <div className="font-semibold text-lg">{hero.stats.health}</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-muted-foreground">Attack</div>
            <div className="font-semibold text-lg">{hero.stats.attack}</div>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-muted-foreground">Defense</div>
            <div className="font-semibold text-lg">{hero.stats.defense}</div>
          </div>
        </div>
        {hero.notes && (
          <p className="mt-4 text-sm text-muted-foreground">{hero.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}
