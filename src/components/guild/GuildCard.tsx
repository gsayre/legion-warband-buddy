import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Doc } from "../../../convex/_generated/dataModel"

interface GuildCardProps {
  guild: Doc<"guilds">
  isMember?: boolean
  hasPendingApplication?: boolean
  onApply?: () => void
}

export function GuildCard({
  guild,
  isMember,
  hasPendingApplication,
  onApply,
}: GuildCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{guild.name}</CardTitle>
        {guild.description && (
          <CardDescription>{guild.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {isMember ? (
            <Link to="/guild/$guildId" params={{ guildId: guild._id }}>
              <Button variant="outline" size="sm">
                View Guild
              </Button>
            </Link>
          ) : hasPendingApplication ? (
            <Button variant="outline" size="sm" disabled>
              Application Pending
            </Button>
          ) : (
            <Button size="sm" onClick={onApply}>
              Apply to Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
