import { useUser } from "@clerk/clerk-react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { MemberCard } from "@/components/guild/MemberCard"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"

export const Route = createFileRoute("/_protected/guild/$guildId/")({
  component: GuildDetail,
})

function GuildDetail() {
  const { guildId } = Route.useParams()
  const { user } = useUser()
  const navigate = useNavigate()
  const guild = useQuery(api.guilds.get, {
    id: guildId as Id<"guilds">,
  })
  const members = useQuery(api.guilds.getMembers, {
    guildId: guildId as Id<"guilds">,
  })
  const myMembership = useQuery(api.guilds.getMyMembership)
  const updateGuild = useMutation(api.guilds.update)
  const deleteGuild = useMutation(api.guilds.remove)
  const leaveGuild = useMutation(api.guilds.leave)
  const removeMember = useMutation(api.guilds.removeMember)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (
    guild === undefined ||
    members === undefined ||
    myMembership === undefined
  ) {
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

  const isOwner = guild.ownerId === user?.id
  const isMember = myMembership?.guildId === guild._id

  if (!isMember) {
    return (
      <div className="min-h-screen p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You must be a member of this guild to view its details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/guild/browse">
              <Button variant="outline">Browse Guilds</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handleUpdateGuild(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await updateGuild({
        id: guildId as Id<"guilds">,
        name: editName.trim() || undefined,
        description: editDescription.trim() || undefined,
      })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update guild")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteGuild() {
    setIsSubmitting(true)
    setError(null)

    try {
      await deleteGuild({ id: guildId as Id<"guilds"> })
      navigate({ to: "/guild" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete guild")
      setIsSubmitting(false)
    }
  }

  async function handleLeaveGuild() {
    setIsSubmitting(true)
    setError(null)

    try {
      await leaveGuild({ guildId: guildId as Id<"guilds"> })
      navigate({ to: "/guild" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave guild")
      setIsSubmitting(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await removeMember({
        guildId: guildId as Id<"guilds">,
        userId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  function openEditDialog() {
    setEditName(guild?.name || "")
    setEditDescription(guild?.description || "")
    setIsEditing(true)
  }

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{guild.name}</h1>
        {guild.description && (
          <p className="text-muted-foreground">{guild.description}</p>
        )}
      </header>

      <main className="space-y-8">
        {error && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Guild Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <>
                  <Button variant="outline" onClick={openEditDialog}>
                    Edit Guild
                  </Button>
                  <Link
                    to="/guild/$guildId/applications"
                    params={{ guildId: guild._id }}
                  >
                    <Button variant="outline">Manage Applications</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleting(true)}
                  >
                    Delete Guild
                  </Button>
                </>
              )}
              {!isOwner && (
                <Button
                  variant="destructive"
                  onClick={handleLeaveGuild}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Leaving..." : "Leave Guild"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members ({members.length})</CardTitle>
            <CardDescription>
              View fellow guild members and their heroes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <MemberCard
                  key={member._id}
                  member={member}
                  guildId={guildId as Id<"guilds">}
                  isOwner={isOwner}
                  isCurrentUser={member.userId === user?.id}
                  onRemove={() => handleRemoveMember(member.userId)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link to="/guild">
            <Button variant="outline">Back to Guild</Button>
          </Link>
        </div>
      </main>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Guild</DialogTitle>
            <DialogDescription>
              Update your guild's information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateGuild} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Guild Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Guild</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this guild? This action cannot be
              undone. All members will be removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteGuild}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Guild"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleting(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
