import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { CharacterCard } from "@/components/character/CharacterCard"
import { CreateCharacterDialog } from "@/components/character/CreateCharacterDialog"
import { type GearMode, GearToggle } from "@/components/character/GearToggle"
import { ImportJsonDialog } from "@/components/character/ImportJsonDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CLASSES, type ClassName } from "@/lib/character-constants"
import { api } from "../../../../convex/_generated/api"

export const Route = createFileRoute("/_protected/characters/")({
  component: CharacterList,
})

function CharacterList() {
  const characters = useQuery(api.characters.list)
  const createCharacter = useMutation(api.characters.create)
  const importCharacters = useMutation(api.characters.importFromJson)

  const [gearMode, setGearMode] = useState<GearMode>("dungeon")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (characters === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const existingClasses = characters.map((c) => c.className as ClassName)
  const hasAllClasses = existingClasses.length === CLASSES.length

  async function handleCreateCharacter(className: ClassName) {
    setIsSubmitting(true)
    try {
      await createCharacter({ className })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleImport(
    chars: Array<{
      className: string
      adventureGear: Array<{
        slot: string
        ilvl: number | null
        secondaryStats: string | null
        setBonus?: string | null
        legendary?: string | null
      }>
      dungeonGear: Array<{
        slot: string
        ilvl: number | null
        secondaryStats: string | null
        setBonus?: string | null
        legendary?: string | null
      }>
    }>,
  ) {
    setIsSubmitting(true)
    try {
      await importCharacters({ characters: chars })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-muted-foreground">
            {characters.length}/{CLASSES.length} classes in your warband
          </p>
        </div>
        <div className="flex items-center gap-4">
          <GearToggle mode={gearMode} onChange={setGearMode} />
        </div>
      </header>

      <main className="space-y-8">
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreateOpen(true)}
            disabled={hasAllClasses}
          >
            Create Character
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            Import from JSON
          </Button>
        </div>

        {/* Character grid */}
        {characters.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => (
              <CharacterCard
                key={character._id}
                id={character._id}
                className={character.className as ClassName}
                adventureGear={character.adventureGear}
                dungeonGear={character.dungeonGear}
                hitPercent={character.hitPercent}
                expertisePercent={character.expertisePercent}
                mode={gearMode}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Characters Yet</CardTitle>
              <CardDescription>
                Create your first character or import from a JSON file to get
                started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={() => setIsCreateOpen(true)}>
                  Create Character
                </Button>
                <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                  Import from JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <Link to="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </main>

      {/* Dialogs */}
      <CreateCharacterDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        existingClasses={existingClasses}
        onCreateCharacter={handleCreateCharacter}
        isSubmitting={isSubmitting}
      />

      <ImportJsonDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleImport}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
