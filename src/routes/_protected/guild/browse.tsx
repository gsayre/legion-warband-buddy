import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { GuildCard } from "@/components/guild/GuildCard"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export const Route = createFileRoute("/_protected/guild/browse")({
  component: BrowseGuilds,
})

function BrowseGuilds() {
  const guilds = useQuery(api.guilds.list)
  const myMembership = useQuery(api.guilds.getMyMembership)
  const applyToGuild = useMutation(api.guilds.apply)
  const [applyingTo, setApplyingTo] = useState<Id<"guilds"> | null>(null)
  const [message, setMessage] = useState("")
  const [pendingApplications, setPendingApplications] = useState<
    Set<Id<"guilds">>
  >(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (guilds === undefined || myMembership === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  async function handleApply() {
    if (!applyingTo) return

    setIsSubmitting(true)
    setError(null)

    try {
      await applyToGuild({
        guildId: applyingTo,
        message: message.trim() || undefined,
      })
      setPendingApplications((prev) => new Set([...prev, applyingTo]))
      setApplyingTo(null)
      setMessage("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply")
    } finally {
      setIsSubmitting(false)
    }
  }

  const myGuildId = myMembership?.guildId

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Browse Guilds</h1>
        <p className="text-muted-foreground">
          Find a guild to join and play with others
        </p>
      </header>

      <main className="space-y-8">
        {myMembership && (
          <Card>
            <CardHeader>
              <CardTitle>Already in a Guild</CardTitle>
              <CardDescription>
                You must leave your current guild before joining another one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/guild">
                <Button variant="outline">Back to Your Guild</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {guilds.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Guilds Found</CardTitle>
              <CardDescription>
                Be the first to create a guild!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/guild/create">
                <Button>Create Guild</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guilds.map((guild) => (
              <GuildCard
                key={guild._id}
                guild={guild}
                isMember={guild._id === myGuildId}
                hasPendingApplication={pendingApplications.has(guild._id)}
                onApply={() => setApplyingTo(guild._id)}
              />
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <Link to="/guild">
            <Button variant="outline">Back to Guild</Button>
          </Link>
        </div>
      </main>

      <Dialog open={applyingTo !== null} onOpenChange={(open) => !open && setApplyingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Guild</DialogTitle>
            <DialogDescription>
              Send a message with your application (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why do you want to join?"
                disabled={isSubmitting}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleApply} disabled={isSubmitting}>
                {isSubmitting ? "Applying..." : "Apply"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setApplyingTo(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
