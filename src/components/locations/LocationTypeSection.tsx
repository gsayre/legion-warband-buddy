import { Plus } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import type { LocationType } from "@/lib/sets-constants"
import type { Id } from "../../../convex/_generated/dataModel"
import type { LocationData } from "../../routes/_protected/locations/index"
import { LocationCard } from "./LocationCard"

// Display labels for location types
const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  dungeon: "Dungeons",
  raid: "Raids",
}

interface LocationTypeSectionProps {
  type: LocationType
  locations: LocationData[]
  isSubmitting: boolean
  onCreateLocation: (name: string) => void
  onUpdateLocation: (id: Id<"locations">, name: string) => void
  onRemoveLocation: (id: Id<"locations">) => void
  onAddBoss: (locationId: Id<"locations">, name: string) => void
  onUpdateBoss: (id: Id<"bosses">, name: string) => void
  onRemoveBoss: (id: Id<"bosses">) => void
}

export function LocationTypeSection({
  type,
  locations,
  isSubmitting,
  onCreateLocation,
  onUpdateLocation,
  onRemoveLocation,
  onAddBoss,
  onUpdateBoss,
  onRemoveBoss,
}: LocationTypeSectionProps) {
  const [newLocationName, setNewLocationName] = useState("")

  function handleCreate() {
    if (newLocationName.trim()) {
      onCreateLocation(newLocationName.trim())
      setNewLocationName("")
    }
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{LOCATION_TYPE_LABELS[type]}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/30 to-transparent" />
        <span className="text-sm text-muted-foreground">
          {locations.length} {locations.length === 1 ? "location" : "locations"}
        </span>
      </div>

      {/* Locations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((location) => (
          <div key={location._id} className="group">
            <LocationCard
              location={location}
              isSubmitting={isSubmitting}
              onUpdate={onUpdateLocation}
              onRemove={onRemoveLocation}
              onAddBoss={onAddBoss}
              onUpdateBoss={onUpdateBoss}
              onRemoveBoss={onRemoveBoss}
            />
          </div>
        ))}
      </div>

      {/* Add new location */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10">
        <Input
          value={newLocationName}
          onChange={(e) => setNewLocationName(e.target.value)}
          placeholder={`Add new ${type}...`}
          className="h-8 text-sm flex-1 bg-transparent border-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate()
          }}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={isSubmitting || !newLocationName.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium transition-colors disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </button>
      </div>
    </div>
  )
}
