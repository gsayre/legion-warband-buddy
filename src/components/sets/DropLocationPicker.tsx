import { useQuery } from "convex/react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DROP_LOCATION_TYPE_LABELS,
  DROP_LOCATION_TYPES,
  type DropLocation,
  type DropLocationType,
  usesStructuredLocations,
} from "@/lib/sets-constants"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

interface DropLocationPickerProps {
  value: DropLocation | undefined
  onChange: (value: DropLocation | undefined) => void
  disabled?: boolean
  compact?: boolean // For inline display in SetCard
}

export function DropLocationPicker({
  value,
  onChange,
  disabled = false,
  compact = false,
}: DropLocationPickerProps) {
  const locationType = value?.type
  const isStructured = locationType && usesStructuredLocations(locationType)

  // Query locations for dungeon/raid types
  const locations = useQuery(
    api.locations.listByType,
    isStructured ? { type: locationType } : "skip",
  )

  // Query bosses for selected location
  const bosses = useQuery(
    api.locations.listBosses,
    isStructured && value?.locationId
      ? { locationId: value.locationId as Id<"locations"> }
      : "skip",
  )

  function handleTypeChange(newType: DropLocationType | "") {
    if (!newType) {
      onChange(undefined)
      return
    }

    // Reset fields when type changes
    if (usesStructuredLocations(newType)) {
      onChange({
        type: newType,
        locationId: undefined,
        bossId: undefined,
      })
    } else {
      onChange({
        type: newType,
        name: "",
        droppedBy: undefined,
      })
    }
  }

  function handleLocationChange(locationId: string) {
    if (!value?.type) return
    onChange({
      type: value.type,
      locationId: locationId || undefined,
      bossId: undefined, // Reset boss when location changes
    })
  }

  function handleBossChange(bossId: string) {
    if (!value?.type) return
    onChange({
      ...value,
      bossId: bossId || undefined,
    })
  }

  function handleNameChange(name: string) {
    if (!value?.type) return
    onChange({
      ...value,
      name,
    })
  }

  function handleDroppedByChange(droppedBy: string) {
    if (!value?.type) return
    onChange({
      ...value,
      droppedBy: droppedBy || undefined,
    })
  }

  const heightClass = compact ? "h-5" : "h-8"
  const textClass = compact ? "text-[10px]" : "text-xs"
  const bgClass = compact ? "bg-muted/20" : ""

  return (
    <div className="flex items-center gap-1">
      {/* Source type selector */}
      <Select
        value={value?.type ?? ""}
        onValueChange={(v) => handleTypeChange(v as DropLocationType | "")}
        disabled={disabled}
      >
        <SelectTrigger
          className={`${heightClass} ${compact ? "w-20 px-1" : "w-28"} ${textClass} ${bgClass}`}
        >
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          {DROP_LOCATION_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {DROP_LOCATION_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Location/Name field */}
      {isStructured ? (
        // Structured: Location dropdown
        <Select
          value={value?.locationId ?? ""}
          onValueChange={handleLocationChange}
          disabled={disabled || !value?.type}
        >
          <SelectTrigger
            className={`${heightClass} flex-1 ${compact ? "px-1" : ""} ${textClass} ${bgClass}`}
          >
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            {locations?.map((loc) => (
              <SelectItem key={loc._id} value={loc._id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        // Freeform: Text input
        <Input
          value={value?.name ?? ""}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Location"
          className={`${heightClass} ${textClass} px-1.5 py-0 flex-1 ${bgClass}`}
          disabled={disabled || !value?.type}
        />
      )}

      {/* Boss/DroppedBy field */}
      {isStructured ? (
        // Structured: Boss dropdown
        <Select
          value={value?.bossId ?? ""}
          onValueChange={handleBossChange}
          disabled={disabled || !value?.locationId}
        >
          <SelectTrigger
            className={`${heightClass} ${compact ? "w-20 px-1" : "w-32"} ${textClass} ${bgClass}`}
          >
            <SelectValue placeholder="Boss" />
          </SelectTrigger>
          <SelectContent>
            {bosses?.map((boss) => (
              <SelectItem key={boss._id} value={boss._id}>
                {boss.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        // Freeform: Text input
        <Input
          value={value?.droppedBy ?? ""}
          onChange={(e) => handleDroppedByChange(e.target.value)}
          placeholder="Boss"
          className={`${heightClass} ${textClass} px-1.5 py-0 ${compact ? "w-20" : "w-32"} ${bgClass}`}
          disabled={disabled || !value?.type}
        />
      )}
    </div>
  )
}

// Helper component to display a drop location (read-only)
interface DropLocationDisplayProps {
  dropLocation: DropLocation
}

export function DropLocationDisplay({
  dropLocation,
}: DropLocationDisplayProps) {
  const isStructured = usesStructuredLocations(dropLocation.type)

  // Query location name if using structured data
  const location = useQuery(
    api.locations.get,
    isStructured && dropLocation.locationId
      ? { id: dropLocation.locationId as Id<"locations"> }
      : "skip",
  )

  // Query boss name if using structured data
  const boss = useQuery(
    api.locations.getBoss,
    isStructured && dropLocation.bossId
      ? { id: dropLocation.bossId as Id<"bosses"> }
      : "skip",
  )

  const locationName = isStructured ? location?.name : dropLocation.name
  const bossName = isStructured ? boss?.name : dropLocation.droppedBy

  return (
    <div className="text-[10px] text-muted-foreground/40 pl-2 mt-0.5">
      {DROP_LOCATION_TYPE_LABELS[dropLocation.type]}
      {locationName && ` · ${locationName}`}
      {bossName && (
        <span className="text-muted-foreground/60"> — {bossName}</span>
      )}
    </div>
  )
}
