import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "convex/react"
import { HeroViewCard } from "@/components/guild/HeroViewCard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "../../../../../../convex/_generated/api"
import type { Id } from "../../../../../../convex/_generated/dataModel"

export const Route = createFileRoute(
  "/_protected/guild/$guildId/members/$userId",
)({
  component: ViewMemberHeroes,
})

function ViewMemberHeroes() {
  const { guildId, userId } = Route.useParams()
  const heroes = useQuery(api.heroes.listByGuildMember, { userId })
  const members = useQuery(api.guilds.getMembers, {
    guildId: guildId as Id<"guilds">,
  })

  if (heroes === undefined || members === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const member = members.find((m) => m.userId === userId)

  if (!member) {
    return (
      <div className="min-h-screen p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Member Not Found</CardTitle>
            <CardDescription>
              This user is not a member of your guild or you don't have
              permission to view their heroes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/guild/$guildId" params={{ guildId }}>
              <Button variant="outline">Back to Guild</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const memberName = member.user?.name || "Unknown User"

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{memberName}'s Warband</h1>
        <p className="text-muted-foreground">Viewing heroes (read-only)</p>
      </header>

      <main className="space-y-8">
        {heroes.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Heroes</CardTitle>
              <CardDescription>
                This member hasn't added any heroes to their warband yet.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {heroes.map((hero) => (
              <HeroViewCard key={hero._id} hero={hero} />
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
