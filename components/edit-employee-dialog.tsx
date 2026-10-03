"use client"

import * as React from "react"
import { Loader2Icon } from "lucide-react"

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

import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { toast } from "@/components/ui/toast"

type UserRole = "ADMIN" | "STAFF" | "SECURITY"

export type EditableEmployee = {
  id: Id<"fingerprintUsers">
  name: string
  employeeNumber: string
  rawDepartment: string
  role: UserRole
  status: "ACTIVE" | "INACTIVE"
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EditableEmployee | null
}) {
  const [fullName, setFullName] = React.useState("")
  const [employeeNumber, setEmployeeNumber] = React.useState("")
  const [department, setDepartment] = React.useState("")
  const [role, setRole] = React.useState<UserRole>("STAFF")
  const [active, setActive] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const updateEmployee = useMutation(
    api.fingerprintUsers.mutation.updateFingerprintUser
  )

  // Sync form state whenever a different employee is opened
  React.useEffect(() => {
    if (employee) {
      setFullName(employee.name)
      setEmployeeNumber(employee.employeeNumber)
      setDepartment(employee.rawDepartment)
      setRole(employee.role)
      setActive(employee.status === "ACTIVE")
      setError(null)
    }
  }, [employee])

  function handleOpenChange(next: boolean) {
    if (!isSaving) {
      onOpenChange(next)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!employee) return

    if (!fullName.trim()) {
      setError("Please enter the employee's full name.")
      return
    }

    if (!employeeNumber.trim()) {
      setError("Please enter the employee number.")
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      await updateEmployee({
        id: employee.id,
        fullName: fullName.trim(),
        employeeNumber: employeeNumber.trim(),
        department: department.trim() || undefined,
        role,
        active,
      })

      toast.add({ type: "success", title: "Staff record updated" })
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update staff record."
      setError(message)
      toast.add({ type: "error", title: "Update failed", description: message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Staff Record</DialogTitle>
          <DialogDescription>
            Update employee details. This does not touch their enrolled
            fingerprint.
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-employee-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-fullName">Full Name</FieldLabel>
              <Input
                id="edit-fullName"
                value={fullName}
                disabled={isSaving}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </Field>

            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel htmlFor="edit-employeeNumber">
                  Employee Number
                </FieldLabel>
                <Input
                  id="edit-employeeNumber"
                  value={employeeNumber}
                  disabled={isSaving}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  required
                />
              </FieldContent>

              <FieldContent>
                <FieldLabel htmlFor="edit-department">Department</FieldLabel>
                <Input
                  id="edit-department"
                  value={department}
                  disabled={isSaving}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-role">Role</FieldLabel>
              <Select
                value={role}
                disabled={isSaving}
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger id="edit-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field orientation="horizontal">
              <Checkbox
                id="edit-active"
                checked={active}
                disabled={isSaving}
                onCheckedChange={(checked) => setActive(checked === true)}
              />
              <FieldLabel htmlFor="edit-active" className="font-normal">
                Active — can access secured areas
              </FieldLabel>
            </Field>
          </FieldGroup>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>

          <Button type="submit" form="edit-employee-form" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}