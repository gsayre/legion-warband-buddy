import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"
import { LocationTypeSection } from "@/components/locations/LocationTypeSection"
import { LOCATION_TYPES, type LocationType } from "@/lib/sets-constants"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"

export const Route = createFileRoute("/_protected/locations/")({
  component: LocationsPage,
})

// Type for location data from the API
export interface LocationData {
  _id: Id<"locations">
  _creationTime: number
  type: LocationType
  name: string
  createdAt: number
  updatedAt: number
}

// Type for boss data from the API
export interface BossData {
  _id: Id<"bosses">
  _creationTime: number
  locationId: Id<"locations">
  name: string
  order?: number
  createdAt: number
  updatedAt: number
}

function LocationsPage() {
  const navigate = useNavigate()
  const user = useQuery(api.users.getMe)
  const locations = useQuery(api.locations.list)

  const createLocation = useMutation(api.locations.create)
  const updateLocation = useMutation(api.locations.update)
  const removeLocation = useMutation(api.locations.remove)
  const addBoss = useMutation(api.locations.addBoss)
  const updateBoss = useMutation(api.locations.updateBoss)
  const removeBoss = useMutation(api.locations.removeBoss)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.isAdmin ?? false

  // Redirect non-admin users
  useEffect(() => {
    if (user !== undefined && !user?.isAdmin) {
      navigate({ to: "/" })
    }
  }, [user, navigate])

  async function handleCreateLocation(type: LocationType, name: string) {
    setIsSubmitting(true)
    setError(null)
    try {
      await createLocation({ type, name })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create location")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateLocation(id: Id<"locations">, name: string) {
    setIsSubmitting(true)
    setError(null)
    try {
      await updateLocation({ id, name })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update location")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveLocation(id: Id<"locations">) {
    setIsSubmitting(true)
    setError(null)
    try {
      await removeLocation({ id })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete location")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddBoss(locationId: Id<"locations">, name: string) {
    setIsSubmitting(true)
    setError(null)
    try {
      await addBoss({ locationId, name })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add boss")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateBoss(id: Id<"bosses">, name: string) {
    setIsSubmitting(true)
    setError(null)
    try {
      await updateBoss({ id, name })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update boss")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveBoss(id: Id<"bosses">) {
    setIsSubmitting(true)
    setError(null)
    try {
      await removeBoss({ id })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete boss")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (locations === undefined || user === undefined) {
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

  // Group locations by type
  const locationsByType = LOCATION_TYPES.reduce(
    (acc, type) => {
      acc[type] = (locations as LocationData[]).filter(
        (loc) => loc.type === type,
      )
      return acc
    },
    {} as Record<LocationType, LocationData[]>,
  )

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Locations</h1>
        <p className="text-muted-foreground">
          Manage dungeons, raids, and their bosses
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

      {/* Two-column layout for dungeon and raid types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {LOCATION_TYPES.map((type) => (
          <LocationTypeSection
            key={type}
            type={type}
            locations={locationsByType[type]}
            isSubmitting={isSubmitting}
            onCreateLocation={(name) => handleCreateLocation(type, name)}
            onUpdateLocation={handleUpdateLocation}
            onRemoveLocation={handleRemoveLocation}
            onAddBoss={handleAddBoss}
            onUpdateBoss={handleUpdateBoss}
            onRemoveBoss={handleRemoveBoss}
          />
        ))}
      </div>
    </div>
  )
}
