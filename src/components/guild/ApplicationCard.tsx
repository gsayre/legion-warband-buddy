import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Doc, Id } from "../../../convex/_generated/dataModel"

interface ApplicationCardProps {
  application: {
    _id: Id<"guildApplications">
    userId: string
    message?: string
    createdAt: number
    user: Doc<"users"> | null
  }
  onApprove: () => void
  onReject: () => void
}

export function ApplicationCard({
  application,
  onApprove,
  onReject,
}: ApplicationCardProps) {
  const displayName = application.user?.name || "Unknown User"
  const appliedAt = new Date(application.createdAt).toLocaleDateString()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {application.user?.imageUrl && (
            <img
              src={application.user.imageUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span>{displayName}</span>
        </CardTitle>
        <CardDescription>Applied on {appliedAt}</CardDescription>
      </CardHeader>
      <CardContent>
        {application.message && (
          <p className="text-sm text-muted-foreground mb-4">
            "{application.message}"
          </p>
        )}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onApprove}>
            Approve
          </Button>
          <Button variant="outline" size="sm" onClick={onReject}>
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
