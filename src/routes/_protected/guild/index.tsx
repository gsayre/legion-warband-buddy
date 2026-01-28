import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "../../../../convex/_generated/api"

export const Route = createFileRoute("/_protected/guild/")({
  component: GuildHub,
})

function GuildHub() {
  const myGuild = useQuery(api.guilds.getMyGuild)
  const myMembership = useQuery(api.guilds.getMyMembership)

  if (myGuild === undefined || myMembership === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Guild</h1>
        <p className="text-muted-foreground">
          Manage your guild membership and view fellow members
        </p>
      </header>

      <main className="space-y-8">
        {myGuild ? (
          <Card>
            <CardHeader>
              <CardTitle>{myGuild.name}</CardTitle>
              {myGuild.description && (
                <CardDescription>{myGuild.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">
                  You are {myMembership?.role === "owner" ? "the owner" : "a member"} of this guild
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/guild/$guildId" params={{ guildId: myGuild._id }}>
                  <Button>View Guild</Button>
                </Link>
                {myMembership?.role === "owner" && (
                  <Link
                    to="/guild/$guildId/applications"
                    params={{ guildId: myGuild._id }}
                  >
                    <Button variant="outline">Manage Applications</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Guild</CardTitle>
              <CardDescription>
                You're not currently in a guild. Create your own or join an existing one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Link to="/guild/create">
                  <Button>Create Guild</Button>
                </Link>
                <Link to="/guild/browse">
                  <Button variant="outline">Browse Guilds</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
