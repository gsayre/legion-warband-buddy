import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { CharacterHeader } from "@/components/character/CharacterHeader"
import { GearGridUShaped } from "@/components/character/GearGridUShaped"
import { GearListTable } from "@/components/character/GearListTable"
import { GearRowEditable } from "@/components/character/GearRowEditable"
import { type GearMode, GearToggle } from "@/components/character/GearToggle"
import { SetBonusSummary } from "@/components/character/SetBonusSummary"
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
import type { ClassName, GearPiece, Slot } from "@/lib/character-constants"
import { getLegendaries } from "@/lib/character-constants"
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
  const sets = useQuery(api.sets.list)
  const updateCharacter = useMutation(api.characters.update)
  const updateGearPiece = useMutation(api.characters.updateGearPiece)
  const removeCharacter = useMutation(api.characters.remove)

  const [gearMode, setGearMode] = useState<GearMode>("dungeon")
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const legendaries = getLegendaries(currentGear)

  async function handleUpdateStats(updates: {
    name?: string
    hitPercent?: number
    expertisePercent?: number
  }) {
    setIsSubmitting(true)
    setError(null)

    try {
      await updateCharacter({
        id: characterId as Id<"characters">,
        ...updates,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update")
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
        itemName: updates.itemName,
        ilvl: updates.ilvl,
        secondaryStats: updates.secondaryStats,
        setBonus: updates.setBonus,
        legendary: updates.legendary,
        quality: updates.quality,
        twoHanded: updates.twoHanded,
      })
      setEditingSlot(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update gear")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditFromTable(slot: Slot, updates: Partial<GearPiece>) {
    setIsSubmitting(true)
    setError(null)

    try {
      await updateGearPiece({
        id: characterId as Id<"characters">,
        gearType: gearMode,
        slot: slot,
        itemName: updates.itemName,
        ilvl: updates.ilvl,
        secondaryStats: updates.secondaryStats,
        setBonus: updates.setBonus,
        legendary: updates.legendary,
        quality: updates.quality,
        twoHanded: updates.twoHanded,
      })
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
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {character.name || character.className}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {character.name ? `${character.className} - ` : ""}Character Details
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            variant="destructive"
            onClick={() => setIsDeleting(true)}
            className="w-full sm:w-auto"
          >
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

      <main className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2">
        {/* Left column - Gear Viewer + Set Bonuses side by side */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-0 p-3 sm:p-4 md:p-6">
            <div className="flex justify-center">
              <GearToggle mode={gearMode} onChange={setGearMode} />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-shrink-0 self-center md:self-start">
                <GearGridUShaped gear={currentGear} />
              </div>
              <div className="flex-1 min-w-0 md:min-w-[200px]">
                <h3 className="font-semibold text-muted-foreground uppercase mb-3 text-sm">
                  Set Bonuses
                </h3>
                <SetBonusSummary
                  gear={currentGear}
                  sets={sets}
                  characterClass={character.className as ClassName}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column - Character Info + Gear List */}
        <div className="space-y-6">
          <CharacterHeader
            name={character.name}
            className={character.className as ClassName}
            gear={currentGear}
            hitPercent={character.hitPercent}
            expertisePercent={character.expertisePercent}
            onUpdateStats={handleUpdateStats}
            isSubmitting={isSubmitting}
          />

          <GearListTable
            gear={currentGear}
            characterClass={character.className as ClassName}
            onEdit={handleEditFromTable}
            isSubmitting={isSubmitting}
          />

          {/* Legendaries */}
          {legendaries.length > 0 && (
            <div className="bg-muted rounded-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase mb-2">
                Legendaries
              </h3>
              <div className="space-y-1">
                {legendaries.map((item) => (
                  <div
                    key={`${item.slot}-${item.legendary}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    style={{ color: "var(--quality-legendary)" }}
                  >
                    <span className="font-semibold">{item.legendary}</span>
                    <span className="text-muted-foreground">({item.slot})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Navigation */}
      <div className="flex gap-4 mt-6 md:mt-8">
        <Link to="/characters" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto">
            Back to Characters
          </Button>
        </Link>
      </div>

      {/* Edit Gear Dialog (from U-shaped grid click) */}
      <Dialog
        open={editingSlot !== null}
        onOpenChange={(open) => !open && setEditingSlot(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editingSlot}</DialogTitle>
            <DialogDescription>Update the gear in this slot</DialogDescription>
          </DialogHeader>
          {editingGearPiece && (
            <GearRowEditable
              gear={editingGearPiece}
              characterClass={character.className as ClassName}
              allGear={currentGear}
              onSave={handleUpdateGear}
              onCancel={() => setEditingSlot(null)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete Character</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your {character.className}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Deleting..." : "Delete Character"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleting(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
