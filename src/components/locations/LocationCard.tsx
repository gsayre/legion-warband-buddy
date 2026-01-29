import { useQuery } from "convex/react"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type {
  BossData,
  LocationData,
} from "../../routes/_protected/locations/index"

interface LocationCardProps {
  location: LocationData
  isSubmitting: boolean
  onUpdate: (id: Id<"locations">, name: string) => void
  onRemove: (id: Id<"locations">) => void
  onAddBoss: (locationId: Id<"locations">, name: string) => void
  onUpdateBoss: (id: Id<"bosses">, name: string) => void
  onRemoveBoss: (id: Id<"bosses">) => void
}

export function LocationCard({
  location,
  isSubmitting,
  onUpdate,
  onRemove,
  onAddBoss,
  onUpdateBoss,
  onRemoveBoss,
}: LocationCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(location.name)
  const [newBossName, setNewBossName] = useState("")
  const [editingBossId, setEditingBossId] = useState<Id<"bosses"> | null>(null)
  const [editBossName, setEditBossName] = useState("")

  const bosses = useQuery(api.locations.listBosses, {
    locationId: location._id,
  })

  function handleSaveName() {
    if (editName.trim() && editName !== location.name) {
      onUpdate(location._id, editName.trim())
    }
    setIsEditing(false)
  }

  function handleCancelEdit() {
    setEditName(location.name)
    setIsEditing(false)
  }

  function handleAddBoss() {
    if (newBossName.trim()) {
      onAddBoss(location._id, newBossName.trim())
      setNewBossName("")
    }
  }

  function handleStartEditBoss(boss: BossData) {
    setEditingBossId(boss._id)
    setEditBossName(boss.name)
  }

  function handleSaveBoss(bossId: Id<"bosses">) {
    if (editBossName.trim()) {
      onUpdateBoss(bossId, editBossName.trim())
    }
    setEditingBossId(null)
  }

  function handleCancelEditBoss() {
    setEditingBossId(null)
    setEditBossName("")
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card/30 p-4">
      {/* Location header */}
      <div className="flex items-center gap-2 mb-3">
        {isEditing ? (
          <>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-7 text-sm font-semibold flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName()
                if (e.key === "Escape") handleCancelEdit()
              }}
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={isSubmitting}
              className="p-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold flex-1">
              {location.name}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(location._id)}
              disabled={isSubmitting}
              className="p-1 rounded hover:bg-red-500/10 text-red-400/70 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Bosses list */}
      <div className="space-y-1.5 pl-3 border-l border-muted-foreground/20">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-medium">
          Bosses
        </div>

        {bosses === undefined ? (
          <div className="text-xs text-muted-foreground animate-pulse">
            Loading...
          </div>
        ) : bosses.length === 0 ? (
          <div className="text-xs text-muted-foreground/50 italic">
            No bosses added yet
          </div>
        ) : (
          bosses.map((boss) => (
            <div
              key={boss._id}
              className="flex items-center gap-1.5 group/boss"
            >
              {editingBossId === boss._id ? (
                <>
                  <Input
                    value={editBossName}
                    onChange={(e) => setEditBossName(e.target.value)}
                    className="h-6 text-xs flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveBoss(boss._id)
                      if (e.key === "Escape") handleCancelEditBoss()
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveBoss(boss._id)}
                    disabled={isSubmitting}
                    className="p-0.5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditBoss}
                    disabled={isSubmitting}
                    className="p-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-foreground/80 flex-1">
                    {boss.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEditBoss(boss as BossData)}
                    className="p-0.5 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover/boss:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveBoss(boss._id)}
                    disabled={isSubmitting}
                    className="p-0.5 rounded hover:bg-red-500/10 text-red-400/70 hover:text-red-400 opacity-0 group-hover/boss:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          ))
        )}

        {/* Add boss input */}
        <div className="flex items-center gap-1.5 pt-1">
          <Input
            value={newBossName}
            onChange={(e) => setNewBossName(e.target.value)}
            placeholder="Add boss..."
            className="h-6 text-xs flex-1 bg-muted/30"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddBoss()
            }}
          />
          <button
            type="button"
            onClick={handleAddBoss}
            disabled={isSubmitting || !newBossName.trim()}
            className="p-1 rounded hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
