import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { ClassColumn } from "@/components/sets/ClassColumn"
import {
  CLASSES,
  type ClassName,
  type SetQuality,
} from "@/lib/character-constants"
import {
  convertDropLocationsForMutation,
  convertPiecesForMutation,
  type GearSet,
  type GearSetFormState,
} from "@/lib/sets-constants"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export const Route = createFileRoute("/_protected/sets/")({
  component: SetsPage,
})

function SetsPage() {
  const navigate = useNavigate()
  const user = useQuery(api.users.getMe)
  const sets = useQuery(api.sets.list)
  const createSet = useMutation(api.sets.create)
  const updateSet = useMutation(api.sets.update)

  // Track which class column is in "create" mode
  const [creatingForClass, setCreatingForClass] = useState<ClassName | null>(
    null,
  )
  // Track which set is being edited AND in which class column
  const [editingSet, setEditingSet] = useState<{
    id: string
    className: ClassName
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.isAdmin ?? false

  // Redirect non-admin users
  useEffect(() => {
    if (user !== undefined && !user?.isAdmin) {
      navigate({ to: "/" })
    }
  }, [user, navigate])

  async function handleCreateSet(
    className: ClassName,
    state: GearSetFormState,
  ) {
    if (!state.quality) {
      setError("Quality is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Include the column's class if not already in the list
      const classes = state.classes.includes(className)
        ? state.classes
        : [...state.classes, className]

      await createSet({
        name: state.name,
        quality: state.quality as SetQuality,
        classes,
        dropLocations:
          state.dropLocations.length > 0
            ? (convertDropLocationsForMutation(
                state.dropLocations,
              ) as Parameters<typeof createSet>[0]["dropLocations"])
            : undefined,
        pieces: convertPiecesForMutation(state.pieces) as Parameters<
          typeof createSet
        >[0]["pieces"],
        bonuses: state.bonuses,
        requiredLevel: state.requiredLevel,
      })
      setCreatingForClass(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create set")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateSet(setId: string, state: GearSetFormState) {
    if (!state.quality) {
      setError("Quality is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updateSet({
        id: setId as Id<"sets">,
        name: state.name,
        quality: state.quality as SetQuality,
        classes: state.classes,
        dropLocations:
          state.dropLocations.length > 0
            ? (convertDropLocationsForMutation(
                state.dropLocations,
              ) as Parameters<typeof updateSet>[0]["dropLocations"])
            : undefined,
        pieces: convertPiecesForMutation(state.pieces) as Parameters<
          typeof updateSet
        >[0]["pieces"],
        bonuses: state.bonuses,
        requiredLevel: state.requiredLevel,
      })
      setEditingSet(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update set")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (sets === undefined || user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Don't render content for non-admin users (redirect is in progress)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Access denied</div>
      </div>
    )
  }

  // Cast sets to GearSet type
  const typedSets = (sets ?? []) as GearSet[]

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Gear Sets</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Manage gear sets for all classes"
            : "Browse gear sets for all classes"}
        </p>
      </header>

      {error && (
        <div className="mb-4 p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 6-column layout for classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {CLASSES.map((className) => (
          <ClassColumn
            key={className}
            className={className}
            sets={typedSets}
            isAdmin={isAdmin}
            isCreating={creatingForClass === className}
            editingSetId={
              editingSet?.className === className ? editingSet.id : null
            }
            onStartCreate={() => setCreatingForClass(className)}
            onCancelCreate={() => setCreatingForClass(null)}
            onSaveNew={(state) => handleCreateSet(className, state)}
            onStartEdit={(set: GearSet) =>
              setEditingSet({ id: set._id, className })
            }
            onCancelEdit={() => setEditingSet(null)}
            onSaveEdit={handleUpdateSet}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </div>
  )
}
