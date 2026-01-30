import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CLASSES, type ClassName } from "@/lib/character-constants"
import { cn } from "@/lib/utils"

interface CreateCharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingClasses: ClassName[]
  onCreateCharacter: (className: ClassName, name?: string) => Promise<void>
  isSubmitting?: boolean
}

export function CreateCharacterDialog({
  open,
  onOpenChange,
  existingClasses,
  onCreateCharacter,
  isSubmitting,
}: CreateCharacterDialogProps) {
  const [selectedClass, setSelectedClass] = useState<ClassName | null>(null)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!selectedClass) return

    setError(null)
    try {
      await onCreateCharacter(selectedClass, name.trim() || undefined)
      setSelectedClass(null)
      setName("")
      onOpenChange(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create character",
      )
    }
  }

  const handleClose = () => {
    setSelectedClass(null)
    setName("")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Character</DialogTitle>
          <DialogDescription>
            Select a class to add to your warband
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="character-name">Character Name (optional)</Label>
            <Input
              id="character-name"
              placeholder="e.g., Thorin, Luna, Shadow..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {CLASSES.map((cls) => {
              const isDisabled = existingClasses.includes(cls)
              const isSelected = selectedClass === cls

              return (
                <button
                  type="button"
                  key={cls}
                  onClick={() => !isDisabled && setSelectedClass(cls)}
                  disabled={isDisabled || isSubmitting}
                  className={cn(
                    "p-4 rounded-lg border-2 text-center transition-all",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                    isDisabled && "opacity-50 cursor-not-allowed bg-muted",
                  )}
                >
                  <div className="font-semibold">{cls}</div>
                  {isDisabled && (
                    <div className="text-xs text-muted-foreground">
                      Already created
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {error && (
            <div className="text-sm text-destructive text-center">{error}</div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedClass || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Character"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
