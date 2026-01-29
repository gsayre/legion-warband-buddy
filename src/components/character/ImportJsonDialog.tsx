import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { CLASSES, type ClassName } from "@/lib/character-constants"

interface ImportCharacter {
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
}

interface ImportData {
  characters?: ImportCharacter[]
}

interface ImportJsonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (characters: ImportCharacter[]) => Promise<void>
  isSubmitting?: boolean
}

export function ImportJsonDialog({
  open,
  onOpenChange,
  onImport,
  isSubmitting,
}: ImportJsonDialogProps) {
  const [jsonText, setJsonText] = useState("")
  const [parsedData, setParsedData] = useState<ImportCharacter[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseJson = (text: string) => {
    setError(null)
    setParsedData(null)

    if (!text.trim()) {
      return
    }

    try {
      const data: ImportData = JSON.parse(text)

      if (!data.characters || !Array.isArray(data.characters)) {
        throw new Error("Invalid format: expected { characters: [...] }")
      }

      // Filter to valid classes only
      const validCharacters = data.characters.filter((char) =>
        CLASSES.includes(char.className as ClassName),
      )

      if (validCharacters.length === 0) {
        throw new Error("No valid characters found in JSON")
      }

      setParsedData(validCharacters)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON")
    }
  }

  const handleTextChange = (text: string) => {
    setJsonText(text)
    parseJson(text)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setJsonText(text)
      parseJson(text)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!parsedData) return

    setError(null)
    try {
      await onImport(parsedData)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import")
    }
  }

  const handleClose = () => {
    setJsonText("")
    setParsedData(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Characters from JSON</DialogTitle>
          <DialogDescription>
            Upload a JSON file or paste your warband data to import characters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload JSON File</Label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                file:cursor-pointer"
              disabled={isSubmitting}
            />
          </div>

          {/* Text input */}
          <div className="space-y-2">
            <Label htmlFor="json-text">Or Paste JSON</Label>
            <textarea
              id="json-text"
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='{"characters": [...]}'
              className="w-full h-40 p-3 text-sm font-mono rounded-md border bg-background resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Preview */}
          {parsedData && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="text-sm font-semibold">
                Preview: {parsedData.length} character(s) to import
              </div>
              <div className="flex flex-wrap gap-2">
                {parsedData.map((char) => {
                  const adventureCount = char.adventureGear.filter(
                    (g) => g.ilvl && g.ilvl > 0,
                  ).length
                  const dungeonCount = char.dungeonGear.filter(
                    (g) => g.ilvl && g.ilvl > 0,
                  ).length

                  return (
                    <div
                      key={char.className}
                      className="bg-background px-3 py-2 rounded-md border text-sm"
                    >
                      <div className="font-semibold">{char.className}</div>
                      <div className="text-xs text-muted-foreground">
                        Adv: {adventureCount}/16 | Dun: {dungeonCount}/16
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsedData || isSubmitting}
            >
              {isSubmitting
                ? "Importing..."
                : `Import ${parsedData?.length || 0} Character(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
