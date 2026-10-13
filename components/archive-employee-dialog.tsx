"use client"

import * as React from "react"
import { ArchiveIcon, Loader2Icon } from "lucide-react"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { toast } from "@/components/ui/toast"

export type ArchivableEmployee = {
  id: Id<"fingerprintUsers">
  name: string
  employeeNumber: string
}

export function ArchiveEmployeeDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: ArchivableEmployee | null
}) {
  const [isArchiving, setIsArchiving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const archiveUser = useMutation(
    api.fingerprintUsers.mutation.archiveFingerprintUser
  )

  function handleOpenChange(next: boolean) {
    if (isArchiving) return
    if (!next) setError(null)
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!employee) return

    setError(null)
    setIsArchiving(true)

    try {
      await archiveUser({ id: employee.id })
      toast.add({
        type: "success",
        title: `${employee.name} archived`,
      })
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to archive employee."
      setError(message)
      toast.add({ type: "error", title: "Archive failed", description: message })
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArchiveIcon className="size-4 text-destructive" />
            Archive {employee?.name}
          </DialogTitle>
          <DialogDescription>
            Their record and access history are kept, but they are
            deactivated and their fingerprint will be denied entry. You can
            restore them at any time.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isArchiving}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={isArchiving}
            onClick={handleConfirm}
          >
            {isArchiving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Archiving...
              </>
            ) : (
              "Archive Employee"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
