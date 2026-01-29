import { UserButton, useUser } from "@clerk/clerk-react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useState } from "react"
import { CharacterCard } from "@/components/character/CharacterCard"
import { CreateCharacterDialog } from "@/components/character/CreateCharacterDialog"
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
import { api } from "../../../convex/_generated/api"

export const Route = createFileRoute("/_protected/dashboard")({
  component: Dashboard,
})

function Dashboard() {
  const { user } = useUser()
  const heroes = useQuery(api.heroes.list)
  const characters = useQuery(api.characters.list)
  const createCharacter = useMutation(api.characters.create)
  const importCharacters = useMutation(api.characters.importFromJson)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const existingClasses = (characters || []).map(
    (c) => c.className as ClassName,
  )
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || "Hero"}!
          </p>
        </div>
        <UserButton />
      </header>

      <main className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Warband</CardTitle>
            <CardDescription>
              {heroes === undefined
                ? "Loading heroes..."
                : heroes.length === 0
                  ? "You haven't added any heroes yet."
                  : `You have ${heroes.length} hero${heroes.length === 1 ? "" : "es"} in your warband.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {heroes && heroes.length > 0 ? (
              <ul className="space-y-2">
                {heroes.map((hero) => (
                  <li
                    key={hero._id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{hero.name}</span>
                      <span className="text-muted-foreground ml-2">
                        Level {hero.level} {hero.class}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      HP: {hero.stats.health} | ATK: {hero.stats.attack} | DEF:{" "}
                      {hero.stats.defense}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Start by adding your first hero to the warband.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Characters/Warband Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Characters</CardTitle>
                <CardDescription>
                  {characters === undefined
                    ? "Loading characters..."
                    : `${characters.length}/${CLASSES.length} classes in your warband`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  disabled={hasAllClasses}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsImportOpen(true)}
                >
                  Import
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {characters && characters.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {characters.slice(0, 6).map((character) => (
                  <CharacterCard
                    key={character._id}
                    id={character._id}
                    className={character.className as ClassName}
                    adventureGear={character.adventureGear}
                    dungeonGear={character.dungeonGear}
                    hitPercent={character.hitPercent}
                    expertisePercent={character.expertisePercent}
                    mode="dungeon"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding characters to your warband
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setIsCreateOpen(true)}>
                    Create Character
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsImportOpen(true)}
                  >
                    Import from JSON
                  </Button>
                </div>
              </div>
            )}
            {characters && characters.length > 0 && (
              <div className="mt-4 text-center">
                <Link to="/characters">
                  <Button variant="link">View All Characters</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guild</CardTitle>
            <CardDescription>
              Join a guild to play with others and view their characters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/guild">
              <Button>Go to Guild</Button>
            </Link>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
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
