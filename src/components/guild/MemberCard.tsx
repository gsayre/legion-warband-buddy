import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Doc, Id } from "../../../convex/_generated/dataModel"

interface MemberCardProps {
  member: {
    _id: Id<"guildMembers">
    userId: string
    role: "owner" | "member"
    joinedAt: number
    user: Doc<"users"> | null
  }
  guildId: Id<"guilds">
  isOwner: boolean
  isCurrentUser: boolean
  onRemove?: () => void
}

export function MemberCard({
  member,
  guildId,
  isOwner,
  isCurrentUser,
  onRemove,
}: MemberCardProps) {
  const displayName = member.user?.name || "Unknown User"
  const isGuildOwner = member.role === "owner"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {member.user?.imageUrl && (
            <img
              src={member.user.imageUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span>{displayName}</span>
          {isGuildOwner && (
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
              Owner
            </span>
          )}
          {isCurrentUser && (
            <span className="text-xs text-muted-foreground">(You)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {!isCurrentUser && (
            <Link
              to="/guild/$guildId/members/$userId"
              params={{ guildId, userId: member.userId }}
            >
              <Button variant="outline" size="sm">
                View Heroes
              </Button>
            </Link>
          )}
          {isOwner && !isGuildOwner && !isCurrentUser && (
            <Button variant="destructive" size="sm" onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
