"use client"

import * as React from "react"
import { FingerprintIcon, ScanLineIcon } from "lucide-react"

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
  const [form, setForm] = React.useState<RegisterEmployeeForm>(initialForm)

  // TODO(AKu): wire these up.
  // - devices: useQuery(api.devices.queries.list) -> populate the
  //   device Select below with esp32Id/name/isOnline
  // - nextFingerprintId: useQuery(api.fingerprintUsers.queries.getNextFingerprintId)
  // - startEnrollment: useMutation(api.fingerprintUsers.mutation.startFingerprintEnrollment)
  //   called with { esp32Id, fullName, employeeNumber, department, role, fingerprintId }
  //   from the "Start Fingerprint Scan" button below
  // - watch deviceCommands (by esp32Id + PENDING) to show scan progress/result

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(initialForm)
    }
    onOpenChange(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO(AKu): call startEnrollment mutation with `form` here
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Employee</DialogTitle>
          <DialogDescription>
            Add an employee and enroll their fingerprint on a device.
          </DialogDescription>
        </DialogHeader>

        <form
          id="register-employee-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
              <Input
                id="fullName"
                placeholder="e.g. Chikumbutso Banda"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                required
              />
            </Field>

            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="employeeNumber">
                  Employee Number
                </FieldLabel>
                <Input
                  id="employeeNumber"
                  placeholder="e.g. EMP-0042"
                  value={form.employeeNumber}
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
                <FieldLabel htmlFor="department">Department</FieldLabel>
                <Input
                  id="department"
                  placeholder="e.g. Operations"
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, role: value as UserRole }))
                }
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {/* Fingerprint enrollment spot */}
          <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FingerprintIcon className="size-4 text-primary" />
              Fingerprint Enrollment
            </div>

            <Field>
              <FieldLabel htmlFor="esp32Id">Device</FieldLabel>
              <Select
                value={form.esp32Id}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, esp32Id: value }))
                }
              >
                <SelectTrigger id="esp32Id" className="w-full">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO(AKu): map over devices from useQuery(api.devices.queries.list) */}
                </SelectContent>
              </Select>
              <FieldDescription>
                The employee will scan their finger on this device.
              </FieldDescription>
            </Field>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={
                !form.fullName || !form.employeeNumber || !form.esp32Id
              }
              onClick={() => {
                // TODO(AKu): call startEnrollment mutation, then poll/subscribe
                // to the resulting deviceCommands row for ACKNOWLEDGED/FAILED
              }}
            >
              <ScanLineIcon className="size-3.5" />
              Start Fingerprint Scan
            </Button>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="register-employee-form">
            Register Employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}