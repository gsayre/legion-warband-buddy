import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { ApplicationCard } from "@/components/guild/ApplicationCard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"

export const Route = createFileRoute("/_protected/guild/$guildId/applications")(
  {
    component: ManageApplications,
  },
)

function ManageApplications() {
  const { guildId } = Route.useParams()
  const guild = useQuery(api.guilds.get, {
    id: guildId as Id<"guilds">,
  })
  const applications = useQuery(api.guilds.getPendingApplications, {
    guildId: guildId as Id<"guilds">,
  })
  const resolveApplication = useMutation(api.guilds.resolveApplication)
  const [error, setError] = useState<string | null>(null)

  if (guild === undefined || applications === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!guild) {
    return (
      <div className="min-h-screen p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Guild Not Found</CardTitle>
            <CardDescription>
              This guild doesn't exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/guild">
              <Button variant="outline">Back to Guild</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handleResolve(
    applicationId: Id<"guildApplications">,
    approved: boolean,
  ) {
    setError(null)
    try {
      await resolveApplication({ applicationId, approved })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resolve application",
      )
    }
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Manage Applications</h1>
        <p className="text-muted-foreground">
          Review and respond to guild applications for {guild.name}
        </p>
      </header>

      <main className="space-y-8">
        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {applications.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Pending Applications</CardTitle>
              <CardDescription>
                There are no pending applications to review at this time.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((application) => (
              <ApplicationCard
                key={application._id}
                application={application}
                onApprove={() => handleResolve(application._id, true)}
                onReject={() => handleResolve(application._id, false)}
              />
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <Link to="/guild/$guildId" params={{ guildId }}>
            <Button variant="outline">Back to Guild</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
