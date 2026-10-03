"use client"

import * as React from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react"

import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { toast } from "@/components/ui/toast"

export type DeletableEmployee = {
  name: string
  employeeNumber: string
  fingerprintId: number
}

export function DeleteEmployeeDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: DeletableEmployee | null
}) {
  const [esp32Id, setEsp32Id] = React.useState("")
  const [commandId, setCommandId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const devices = useQuery(api.devices.queries.list)
  const startDeletion = useMutation(
    api.deviceCommands.mutations.startFingerprintDeletion
  )

  const selectedDevice = React.useMemo(
    () => devices?.find((device) => device.esp32Id === esp32Id),
    [devices, esp32Id]
  )

  const commands = useQuery(
    api.deviceCommands.queries.listByDevice,
    selectedDevice ? { deviceId: selectedDevice._id } : "skip"
  )

  const deletionCommand = React.useMemo(() => {
    if (!commandId || !commands) return null
    return commands.find((c) => c._id === commandId)
  }, [commands, commandId])

  React.useEffect(() => {
    if (!deletionCommand) return

    if (deletionCommand.status === "ACKNOWLEDGED") {
      setIsDeleting(false)
      toast.add({ type: "success", title: `${employee?.name ?? "Staff member"} removed from the system` })

      const timer = setTimeout(() => reset(false), 800)
      return () => clearTimeout(timer)
    }

    if (deletionCommand.status === "FAILED") {
      setIsDeleting(false)
      setError(deletionCommand.failureReason || "Fingerprint deletion failed.")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletionCommand])

  function reset(next: boolean) {
    setEsp32Id("")
    setCommandId(null)
    setIsDeleting(false)
    setError(null)
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!employee) return

    if (!esp32Id) {
      setError("Select which device this fingerprint is enrolled on.")
      return
    }

    if (!selectedDevice?.isOnline) {
      setError("This device is offline. Please select an online device.")
      return
    }

    setError(null)
    setIsDeleting(true)

    try {
      const result = await startDeletion({
        esp32Id,
        fingerprintId: employee.fingerprintId,
      })
      setCommandId(result.commandId)
    } catch (err) {
      setIsDeleting(false)
      const message =
        err instanceof Error ? err.message : "Failed to start deletion."
      setError(message)
      toast.add({ type: "error", title: "Deletion failed", description: message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isDeleting && reset(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="size-4 text-destructive" />
            Remove {employee?.name}
          </DialogTitle>
          <DialogDescription>
            This deletes their fingerprint from the sensor and removes them
            from the system. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Select
            value={esp32Id}
            disabled={isDeleting || devices === undefined}
            onValueChange={(value) => setEsp32Id(value ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select the device it's enrolled on" />
            </SelectTrigger>
            <SelectContent>
              {devices?.map((device) => (
                <SelectItem
                  key={device._id}
                  value={device.esp32Id}
                  disabled={!device.isOnline}
                >
                  <div className="flex items-center gap-2">
                    <span>{device.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({device.esp32Id})
                    </span>
                    {!device.isOnline && (
                      <span className="text-xs text-destructive">Offline</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isDeleting && !deletionCommand && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Waiting for the device to confirm deletion...
            </div>
          )}

          {deletionCommand?.status === "ACKNOWLEDGED" && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
              <CheckCircle2Icon className="size-4" />
              Removed successfully.
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => reset(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting || !esp32Id || !selectedDevice?.isOnline}
            onClick={handleConfirm}
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Employee"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}