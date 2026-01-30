import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CLASS_COLORS, type ClassName } from "@/lib/character-constants"
import {
  createEmptySetFormState,
  type GearSet,
  type GearSetFormState,
} from "@/lib/sets-constants"
import { SetCard } from "./SetCard"

interface ClassColumnProps {
  className: ClassName
  sets: GearSet[]
  isAdmin: boolean
  isCreating: boolean
  editingSetId: string | null
  onStartCreate: () => void
  onCancelCreate: () => void
  onSaveNew: (state: GearSetFormState) => void
  onStartEdit: (set: GearSet) => void
  onCancelEdit: () => void
  onSaveEdit: (setId: string, state: GearSetFormState) => void
  isSubmitting: boolean
}

export function ClassColumn({
  className,
  sets,
  isAdmin,
  isCreating,
  editingSetId,
  onStartCreate,
  onCancelCreate,
  onSaveNew,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  isSubmitting,
}: ClassColumnProps) {
  // Filter sets that include this class
  const classSets = sets.filter((set) => set.classes.includes(className))

  return (
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div className="flex items-center justify-between pb-3 border-b mb-3">
        <h3
          className="font-semibold text-sm"
          style={{ color: CLASS_COLORS[className] }}
        >
          {className}
        </h3>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartCreate}
            className="h-7 w-7 p-0"
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 space-y-5 overflow-y-auto">
        {/* New set card at top when creating */}
        {isCreating && (
          <SetCard
            isAdmin={isAdmin}
            isEditing={true}
            onStartEdit={() => {}}
            onCancelEdit={onCancelCreate}
            onSave={onSaveNew}
            isSubmitting={isSubmitting}
            initialFormState={{
              ...createEmptySetFormState(),
              classes: [className],
            }}
          />
        )}

        {/* Existing sets */}
        {classSets.map((set) => (
          <SetCard
            key={set._id}
            set={set}
            isAdmin={isAdmin}
            isEditing={editingSetId === set._id}
            onStartEdit={() => onStartEdit(set)}
            onCancelEdit={onCancelEdit}
            onSave={(state) => onSaveEdit(set._id, state)}
            isSubmitting={isSubmitting}
          />
        ))}

        {/* Empty state */}
        {classSets.length === 0 && !isCreating && (
          <div className="text-xs text-muted-foreground text-center py-8">
            No sets for {className}
          </div>
        )}
      </div>
    </div>
  )
}
