"use client"

import * as React from "react"
import {
  FingerprintIcon,
  ScanLineIcon,
  CheckCircle2Icon,
  Loader2Icon,
  AlertCircleIcon,
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
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type UserRole = "ADMIN" | "STAFF" | "SECURITY"

type RegisterEmployeeForm = {
  fullName: string
  employeeNumber: string
  department: string
  role: UserRole
  esp32Id: string
}

const initialForm: RegisterEmployeeForm = {
  fullName: "",
  employeeNumber: "",
  department: "",
  role: "STAFF",
  esp32Id: "",
}

export function RegisterEmployeeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [form, setForm] =
    React.useState<RegisterEmployeeForm>(initialForm)

  const [commandId, setCommandId] = React.useState<string | null>(null)

  const [isStarting, setIsStarting] = React.useState(false)

  const [message, setMessage] = React.useState<string | null>(null)

  const [error, setError] = React.useState<string | null>(null)

  // ------------------------------------------
  // DEVICES
  // ------------------------------------------

  const devices = useQuery(api.devices.queries.list)

  // ------------------------------------------
  // NEXT FINGERPRINT SLOT
  // ------------------------------------------

  const nextFingerprint = useQuery(
    api.fingerprintUsers.queries.getNextFingerprintId
  )

  // ------------------------------------------
  // START ENROLLMENT
  // ------------------------------------------

  const startEnrollment = useMutation(
    api.fingerprintUsers.mutation.startFingerprintEnrollment
  )

  // ------------------------------------------
  // SELECTED DEVICE
  // ------------------------------------------

  const selectedDevice = React.useMemo(() => {
    return devices?.find(
      (device) => device.esp32Id === form.esp32Id
    )
  }, [devices, form.esp32Id])

  // ------------------------------------------
  // WATCH COMMANDS
  // ------------------------------------------

  const commands = useQuery(
    api.deviceCommands.queries.listByDevice,
    selectedDevice
      ? {
          deviceId: selectedDevice._id,
        }
      : "skip"
  )

  // Find the command we just created.
  const enrollmentCommand = React.useMemo(() => {
    if (!commandId || !commands) {
      return null
    }

    return commands.find(
      (command) => command._id === commandId
    )
  }, [commands, commandId])

  // ------------------------------------------
  // WATCH ENROLLMENT RESULT
  // ------------------------------------------

  React.useEffect(() => {
    if (!enrollmentCommand) {
      return
    }

    if (enrollmentCommand.status === "ACKNOWLEDGED") {
      setIsStarting(false)
      setMessage(
        "Fingerprint registered successfully."
      )
      setError(null)

      // Give Convex a moment to update the users query,
      // then close the dialog.
      const timer = setTimeout(() => {
        handleOpenChange(false)
      }, 1200)

      return () => clearTimeout(timer)
    }

    if (enrollmentCommand.status === "FAILED") {
      setIsStarting(false)

      setError(
        enrollmentCommand.failureReason ||
          "Fingerprint enrollment failed."
      )

      setMessage(null)
    }
  }, [enrollmentCommand])

  // ------------------------------------------
  // RESET WHEN DIALOG CLOSES
  // ------------------------------------------

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(initialForm)
      setCommandId(null)
      setIsStarting(false)
      setMessage(null)
      setError(null)
    }

    onOpenChange(next)
  }

  // ------------------------------------------
  // START FINGERPRINT ENROLLMENT
  // ------------------------------------------

  async function startFingerprintScan() {
    setError(null)
    setMessage(null)

    if (!form.fullName.trim()) {
      setError("Please enter the employee's full name.")
      return
    }

    if (!form.employeeNumber.trim()) {
      setError("Please enter the employee number.")
      return
    }

    if (!form.esp32Id) {
      setError("Please select a device.")
      return
    }

    if (!selectedDevice) {
      setError("Selected device could not be found.")
      return
    }

    if (!selectedDevice.isOnline) {
      setError(
        "This device is offline. Please select an online device."
      )
      return
    }

    if (!nextFingerprint) {
      setError(
        "Unable to determine the next fingerprint slot."
      )
      return
    }

    try {
      setIsStarting(true)

      const result = await startEnrollment({
        esp32Id: form.esp32Id,
        fullName: form.fullName.trim(),
        employeeNumber: form.employeeNumber.trim(),
        department: form.department.trim() || undefined,
        role: form.role,
        fingerprintId: nextFingerprint.fingerprintId,
      })

      setCommandId(result.commandId)

      setMessage(
        `Fingerprint slot ${nextFingerprint.fingerprintId} assigned. Place the employee's finger on the sensor.`
      )
    } catch (err) {
      console.error("Fingerprint enrollment error:", err)

      setIsStarting(false)

      setError(
        err instanceof Error
          ? err.message
          : "Failed to start fingerprint enrollment."
      )
    }
  }

  // ------------------------------------------
  // FORM SUBMIT
  // ------------------------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isStarting) {
      startFingerprintScan()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Register New Employee
          </DialogTitle>

          <DialogDescription>
            Add an employee and enroll their fingerprint
            on a security device.
          </DialogDescription>
        </DialogHeader>

        <form
          id="register-employee-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            {/* FULL NAME */}

            <Field>
              <FieldLabel htmlFor="fullName">
                Full Name
              </FieldLabel>

              <Input
                id="fullName"
                placeholder="e.g. Chikumbutso Banda"
                value={form.fullName}
                disabled={isStarting}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    fullName: e.target.value,
                  }))
                }
                required
              />
            </Field>

            {/* EMPLOYEE NUMBER + DEPARTMENT */}

            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="employeeNumber">
                  Employee Number
                </FieldLabel>

                <Input
                  id="employeeNumber"
                  placeholder="e.g. EMP-0042"
                  value={form.employeeNumber}
                  disabled={isStarting}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      employeeNumber: e.target.value,
                    }))
                  }
                  required
                />
              </FieldContent>

              <FieldContent>
                <FieldLabel htmlFor="department">
                  Department
                </FieldLabel>

                <Input
                  id="department"
                  placeholder="e.g. Operations"
                  value={form.department}
                  disabled={isStarting}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      department: e.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            {/* ROLE */}

            <Field>
              <FieldLabel htmlFor="role">
                Role
              </FieldLabel>

              <Select
                value={form.role}
                disabled={isStarting}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    role: value as UserRole,
                  }))
                }
              >
                <SelectTrigger
                  id="role"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="STAFF">
                    Staff
                  </SelectItem>

                  <SelectItem value="SECURITY">
                    Security
                  </SelectItem>

                  <SelectItem value="ADMIN">
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {/* FINGERPRINT */}

          <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FingerprintIcon className="size-4 text-primary" />

              Fingerprint Enrollment
            </div>

            {/* DEVICE */}

            <Field>
              <FieldLabel htmlFor="esp32Id">
                Device
              </FieldLabel>

              <Select
                value={form.esp32Id}
                disabled={
                  isStarting ||
                  devices === undefined
                }
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                      esp32Id: value ?? "",
                  }))
                }
              >
                <SelectTrigger
                  id="esp32Id"
                  className="w-full"
                >
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>

                <SelectContent>
                  {devices?.map((device) => (
                    <SelectItem
                      key={device._id}
                      value={device.esp32Id}
                      disabled={!device.isOnline}
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {device.name}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          ({device.esp32Id})
                        </span>

                        {!device.isOnline && (
                          <span className="text-xs text-destructive">
                            Offline
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <FieldDescription>
                The employee will scan their finger on
                this device.
              </FieldDescription>
            </Field>

            {/* FINGERPRINT SLOT */}

            <div className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Fingerprint Slot
              </span>

              <span className="font-mono font-medium">
                {nextFingerprint
                  ? `#${nextFingerprint.fingerprintId}`
                  : "Loading..."}
              </span>
            </div>

            {/* STATUS */}

            {message && (
              <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
                {enrollmentCommand?.status ===
                "ACKNOWLEDGED" ? (
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <FingerprintIcon className="mt-0.5 size-4 shrink-0" />
                )}

                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            {/* START SCAN */}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={
                isStarting ||
                !form.fullName ||
                !form.employeeNumber ||
                !form.esp32Id ||
                !nextFingerprint ||
                !selectedDevice?.isOnline
              }
              onClick={startFingerprintScan}
            >
              {isStarting ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Waiting for fingerprint...
                </>
              ) : (
                <>
                  <ScanLineIcon className="size-3.5" />
                  Start Fingerprint Scan
                </>
              )}
            </Button>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isStarting}
            onClick={() =>
              handleOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="register-employee-form"
            disabled={
              isStarting ||
              !form.fullName ||
              !form.employeeNumber ||
              !form.esp32Id ||
              !nextFingerprint ||
              !selectedDevice?.isOnline
            }
          >
            {isStarting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Employee"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
