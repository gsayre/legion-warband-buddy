import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { GearLayout } from "@/components/character/GearLayout"
import { GearRowEditable } from "@/components/character/GearRowEditable"
import { type GearMode, GearToggle } from "@/components/character/GearToggle"
import { StatSheet } from "@/components/character/StatSheet"
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
import type { ClassName, GearPiece, Slot } from "@/lib/character-constants"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export const Route = createFileRoute("/_protected/characters/$characterId")({
  component: CharacterDetail,
})

function CharacterDetail() {
  const { characterId } = Route.useParams()
  const navigate = useNavigate()

  const character = useQuery(api.characters.get, {
    id: characterId as Id<"characters">,
  })
  const updateCharacter = useMutation(api.characters.update)
  const updateGearPiece = useMutation(api.characters.updateGearPiece)
  const removeCharacter = useMutation(api.characters.remove)

  const [gearMode, setGearMode] = useState<GearMode>("dungeon")
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null)
  const [isEditingStats, setIsEditingStats] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stats editing state
  const [editHitPercent, setEditHitPercent] = useState("")
  const [editExpertisePercent, setEditExpertisePercent] = useState("")

  if (character === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Character Not Found</CardTitle>
            <CardDescription>
              This character doesn't exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/characters">
              <Button variant="outline">Back to Characters</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentGear =
    gearMode === "adventure" ? character.adventureGear : character.dungeonGear
  const editingGearPiece = editingSlot
    ? currentGear.find((g) => g.slot === editingSlot)
    : null

  function openStatsEditor() {
    setEditHitPercent(character!.hitPercent.toString())
    setEditExpertisePercent(character!.expertisePercent.toString())
    setIsEditingStats(true)
  }

  async function handleUpdateStats(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await updateCharacter({
        id: characterId as Id<"characters">,
        hitPercent: parseFloat(editHitPercent) || 0,
        expertisePercent: parseFloat(editExpertisePercent) || 0,
      })
      setIsEditingStats(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update stats")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateGear(updates: Partial<GearPiece>) {
    if (!editingSlot) return

    setIsSubmitting(true)
    setError(null)

    try {
      await updateGearPiece({
        id: characterId as Id<"characters">,
        gearType: gearMode,
        slot: editingSlot,
        ilvl: updates.ilvl,
        secondaryStats: updates.secondaryStats,
        setBonus: updates.setBonus,
        legendary: updates.legendary,
        quality: updates.quality,
      })
      setEditingSlot(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update gear")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    setIsSubmitting(true)
    setError(null)

    try {
      await removeCharacter({ id: characterId as Id<"characters"> })
      navigate({ to: "/characters" })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete character",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{character.className}</h1>
          <p className="text-muted-foreground">Character Details</p>
        </div>
        <div className="flex items-center gap-4">
          <GearToggle mode={gearMode} onChange={setGearMode} />
          <Button variant="destructive" onClick={() => setIsDeleting(true)}>
            Delete
          </Button>
        </div>
      </header>

      {error && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <main className="grid gap-8 lg:grid-cols-[1fr,300px]">
        {/* Left column - Gear Layout */}
        <Card>
          <CardHeader>
            <CardTitle>
              {gearMode === "adventure" ? "Adventure" : "Dungeon"} Gear
            </CardTitle>
            <CardDescription>Click a slot to edit</CardDescription>
          </CardHeader>
          <CardContent>
            {editingSlot && editingGearPiece ? (
              <GearRowEditable
                gear={editingGearPiece}
                onSave={handleUpdateGear}
                onCancel={() => setEditingSlot(null)}
                isSubmitting={isSubmitting}
              />
            ) : (
              <GearLayout
                gear={currentGear}
                onSlotClick={(slot) => setEditingSlot(slot)}
              />
            )}
          </CardContent>
        </Card>

        {/* Right column - Stats */}
        <div>
          <StatSheet
            className={character.className as ClassName}
            gear={currentGear}
            hitPercent={character.hitPercent}
            expertisePercent={character.expertisePercent}
            onEditStats={openStatsEditor}
          />
        </div>
      </main>

      {/* Navigation */}
      <div className="flex gap-4 mt-8">
        <Link to="/characters">
          <Button variant="outline">Back to Characters</Button>
        </Link>
      </div>

      {/* Edit Stats Dialog */}
      <Dialog open={isEditingStats} onOpenChange={setIsEditingStats}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Combat Stats</DialogTitle>
            <DialogDescription>
              Update your hit and expertise percentages
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStats} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hit-percent">Hit %</Label>
              <Input
                id="hit-percent"
                type="number"
                step="0.1"
                value={editHitPercent}
                onChange={(e) => setEditHitPercent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expertise-percent">Expertise %</Label>
              <Input
                id="expertise-percent"
                type="number"
                step="0.1"
                value={editExpertisePercent}
                onChange={(e) => setEditExpertisePercent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingStats(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Character</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your {character.className}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Character"}
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
