"use client"

import {
  ArrowUpDownIcon,
  FingerprintIcon,
  UserCheckIcon,
  UserXIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from "@tanstack/react-table"
import { useQuery } from "convex/react"
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react"
import React from "react"
import { RegisterEmployeeDialog } from "@/components/register-employee-dialog"
import { EditEmployeeDialog, type EditableEmployee } from "@/components/edit-employee-dialog"
import { DeleteEmployeeDialog, type DeletableEmployee } from "@/components/delete-employee-dialog"

type UserRole = "ADMIN" | "STAFF" | "SECURITY"
type UserStatus = "ACTIVE" | "INACTIVE"

type RegisteredUser = {
  id: Id<"fingerprintUsers">
  fingerprintId: number
  name: string
  employeeNumber: string
  role: UserRole
  department: string
  rawDepartment: string
  status: UserStatus
  fingerprintRegistered: boolean
  registeredAt: string
  lastAccess: string | null
}

const roleStyles: Record<UserRole, string> = {
  ADMIN:
    "text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/30",
  SECURITY:
    "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30",
  STAFF:
    "text-gray-600 border-gray-300 bg-gray-50 dark:bg-gray-900/30",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const baseColumns: ColumnDef<RegisteredUser>[] = [
  {
    accessorKey: "name",

    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting()}
      >
        Employee
        <ArrowUpDownIcon className="ml-1 size-3" />
      </Button>
    ),

    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(row.original.name)}
          </AvatarFallback>
        </Avatar>

        <div>
          <div className="font-medium">
            {row.original.name}
          </div>

          <div className="text-xs text-muted-foreground">
            {row.original.employeeNumber}
          </div>
        </div>
      </div>
    ),
  },

  {
    accessorKey: "department",

    header: "Department",

    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.department}
      </div>
    ),
  },

  {
    accessorKey: "role",

    header: "Role",

    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={roleStyles[row.original.role]}
      >
        {row.original.role}
      </Badge>
    ),
  },

  {
    accessorKey: "fingerprintRegistered",

    header: "Fingerprint",

    cell: ({ row }) =>
      row.original.fingerprintRegistered ? (
        <div className="flex items-center gap-1.5 text-green-600 text-sm">
          <FingerprintIcon className="size-3.5" />
          Registered
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-red-500 text-sm">
          <FingerprintIcon className="size-3.5" />
          Not registered
        </div>
      ),
  },

  {
    accessorKey: "status",

    header: "Status",

    cell: ({ row }) =>
      row.original.status === "ACTIVE" ? (
        <Badge
          variant="outline"
          className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
        >
          <UserCheckIcon className="size-3 mr-1" />
          Active
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="text-gray-500 border-gray-300 bg-gray-50 dark:bg-gray-900/30"
        >
          <UserXIcon className="size-3 mr-1" />
          Inactive
        </Badge>
      ),
  },

  {
    accessorKey: "lastAccess",

    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting()}
      >
        Last Access
        <ArrowUpDownIcon className="ml-1 size-3" />
      </Button>
    ),

    cell: ({ row }) => {
      if (!row.original.lastAccess) {
        return (
          <span className="text-xs text-muted-foreground">
            Never
          </span>
        )
      }

      const date = new Date(row.original.lastAccess)

      return (
        <div className="text-sm">
          <div>
            {date.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      )
    },
  },

]

function getActionsColumn(
  onEdit: (user: RegisteredUser) => void,
  onDelete: (user: RegisteredUser) => void
): ColumnDef<RegisteredUser> {
  return {
    id: "actions",

    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
        >
          <MoreHorizontalIcon className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            <PencilIcon className="size-3.5" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            variant="destructive"
            disabled={!row.original.fingerprintRegistered}
            onClick={() => onDelete(row.original)}
          >
            <Trash2Icon className="size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  }
}

export default function UsersPage() {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ])

  const [roleFilter, setRole] = React.useState("ALL")
  const [statusFilter, setStatus] = React.useState("ALL")
  const [search, setSearch] = React.useState("")
  const [registerOpen, setRegisterOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<RegisteredUser | null>(null)
  const [deletingUser, setDeletingUser] = React.useState<RegisteredUser | null>(null)

  const users = useQuery(
    api.fingerprintUsers.queries.getRegisteredUsers
  )

  const totalActive =
    users?.filter((user) => user.status === "ACTIVE").length ?? 0

  const totalFingerprint =
    users?.filter((user) => user.fingerprintRegistered).length ?? 0

  const pendingReg =
    users?.filter(
      (user) =>
        !user.fingerprintRegistered &&
        user.status === "ACTIVE"
    ).length ?? 0

  const filtered = React.useMemo(() => {
    if (!users) return []

    return users.filter((row) => {
      const matchRole =
        roleFilter === "ALL" || row.role === roleFilter

      const matchStatus =
        statusFilter === "ALL" ||
        row.status === statusFilter

      const searchValue = search.toLowerCase()

      const matchSearch =
        row.name.toLowerCase().includes(searchValue) ||
        row.employeeNumber.toLowerCase().includes(searchValue) ||
        row.department.toLowerCase().includes(searchValue)

      return matchRole && matchStatus && matchSearch
    })
  }, [users, roleFilter, statusFilter, search])

  const columns = React.useMemo(
    () => [
      ...baseColumns,
      getActionsColumn(setEditingUser, setDeletingUser),
    ],
    []
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),

    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Total Employees
            </CardDescription>

            <CardTitle className="text-3xl">
              {users?.length ?? 0}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            {totalActive} active accounts
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Fingerprints Registered
            </CardDescription>

            <CardTitle className="text-3xl text-green-600">
              {totalFingerprint}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            {users?.length
              ? Math.round(
                  (totalFingerprint / users.length) * 100
                )
              : 0}
            % of employees enrolled
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Pending Registration
            </CardDescription>

            <CardTitle className="text-3xl text-orange-500">
              {pendingReg}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Active users without fingerprint
          </CardContent>
        </Card>

      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              Registered Users
            </CardTitle>

            <CardDescription>
              All employees enrolled in the security system
            </CardDescription>
          </div>

          <Button
            size="sm"
            className="h-8"
            onClick={() => setRegisterOpen(true)}
          >
            <PlusIcon className="size-3.5 mr-1" />
            Add Employee
          </Button>
        </CardHeader>

        <CardContent>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">

            <Input
              placeholder="Search name, number, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm sm:w-64"
            />

            <Select
              value={roleFilter}
              onValueChange={(value) =>
                setRole(value ?? "ALL")
              }
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All roles
                </SelectItem>

                <SelectItem value="ADMIN">
                  Admin
                </SelectItem>

                <SelectItem value="SECURITY">
                  Security
                </SelectItem>

                <SelectItem value="STAFF">
                  Staff
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatus(value ?? "ALL")
              }
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All statuses
                </SelectItem>

                <SelectItem value="ACTIVE">
                  Active
                </SelectItem>

                <SelectItem value="INACTIVE">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} results
            </span>

          </div>

          {/* Loading */}
          {users === undefined ? (
            <div className="rounded-md border">
              <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                Loading registered users...
              </div>
            </div>
          ) : (

            <>
              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>
                            {h.isPlaceholder
                              ? null
                              : flexRender(
                                  h.column.columnDef.header,
                                  h.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className={
                            !row.original.fingerprintRegistered
                              ? "bg-orange-50/30 dark:bg-orange-950/10"
                              : ""
                          }
                        >
                          {row
                            .getVisibleCells()
                            .map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
                <span>
                  Page{" "}
                  {table.getState().pagination.pageIndex + 1}{" "}
                  of{" "}
                  {Math.max(1, table.getPageCount())}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

        </CardContent>
      </Card>

      <RegisterEmployeeDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />

      <EditEmployeeDialog
        open={editingUser !== null}
        onOpenChange={(open) => !open && setEditingUser(null)}
        employee={
          editingUser
            ? ({
                id: editingUser.id,
                name: editingUser.name,
                employeeNumber: editingUser.employeeNumber,
                rawDepartment: editingUser.rawDepartment,
                role: editingUser.role,
                status: editingUser.status,
              } satisfies EditableEmployee)
            : null
        }
      />

      <DeleteEmployeeDialog
        open={deletingUser !== null}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        employee={
          deletingUser
            ? ({
                name: deletingUser.name,
                employeeNumber: deletingUser.employeeNumber,
                fingerprintId: deletingUser.fingerprintId,
              } satisfies DeletableEmployee)
            : null
        }
      />
    </div>
  )
}