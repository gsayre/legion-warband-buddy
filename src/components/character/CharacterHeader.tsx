import { Check, Pencil, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ClassName, GearPiece } from "@/lib/character-constants"
import { calculateAverageIlvl, isStatCapped } from "@/lib/character-constants"
import { cn } from "@/lib/utils"

interface CharacterHeaderProps {
  className: ClassName
  gear: GearPiece[]
  hitPercent: number
  expertisePercent: number
  onUpdateStats: (updates: {
    hitPercent?: number
    expertisePercent?: number
  }) => Promise<void>
  isSubmitting?: boolean
}

interface InlineEditableStatProps {
  label: string
  value: number
  isCapped: boolean
  onSave: (newValue: number) => Promise<void>
  isSubmitting?: boolean
}

function InlineEditableStat({
  label,
  value,
  isCapped,
  onSave,
  isSubmitting,
}: InlineEditableStatProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setEditValue(value.toString())
    setIsEditing(true)
  }

  const handleSave = async () => {
    const numValue = parseFloat(editValue) || 0
    await onSave(numValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value.toString())
    setIsEditing(false)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type="number"
            step="0.1"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleSave}
            disabled={isSubmitting}
            className="w-20 h-8 text-sm"
          />
          <span className="text-muted-foreground">%</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="flex items-center gap-2 group cursor-pointer bg-transparent border-none p-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleStartEdit}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-xl font-bold",
          isCapped ? "text-green-500 font-semibold" : "text-yellow-500",
        )}
      >
        {value.toFixed(1)}%
        {isCapped && <span className="text-xs ml-1 opacity-80">(CAP)</span>}
      </span>
      <Pencil
        className={cn(
          "h-3 w-3 text-muted-foreground transition-opacity",
          isHovered ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  )
}

export function CharacterHeader({
  className,
  gear,
  hitPercent,
  expertisePercent,
  onUpdateStats,
  isSubmitting,
}: CharacterHeaderProps) {
  const avgIlvl = calculateAverageIlvl(gear)
  const hitCapped = isStatCapped("hit", hitPercent)
  const expertiseCapped = isStatCapped("expertise", expertisePercent)

  const handleUpdateHit = async (newValue: number) => {
    await onUpdateStats({ hitPercent: newValue })
  }

  const handleUpdateExpertise = async (newValue: number) => {
    await onUpdateStats({ expertisePercent: newValue })
  }

  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Class and iLvl */}
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{className}</h2>
          <div className="text-2xl font-bold text-primary">
            {avgIlvl > 0 ? avgIlvl.toFixed(1) : "-"}
            <span className="text-sm text-muted-foreground ml-1">ilvl</span>
          </div>
        </div>

        {/* Hit and Expertise - inline editable */}
        <div className="flex items-center gap-6">
          <InlineEditableStat
            label="Hit"
            value={hitPercent}
            isCapped={hitCapped}
            onSave={handleUpdateHit}
            isSubmitting={isSubmitting}
          />
          <InlineEditableStat
            label="Expertise"
            value={expertisePercent}
            isCapped={expertiseCapped}
            onSave={handleUpdateExpertise}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}
