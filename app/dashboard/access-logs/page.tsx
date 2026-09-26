"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  ShieldCheckIcon,
  ShieldXIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpDownIcon,
  FilterIcon,
} from "lucide-react"
import { useQuery } from "convex/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/convex/_generated/api"

type AccessLog = {
  id: string
  employeeName: string
  employeeNumber: string | null
  device: string
  location: string
  status: "GRANTED" | "DENIED"
  timestamp: string
}

const columns: ColumnDef<AccessLog>[] = [
  {
    accessorKey: "employeeName",

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
      <div>
        <div className="font-medium">
          {row.original.employeeName}
        </div>

        <div className="text-xs text-muted-foreground">
          {row.original.employeeNumber ?? "—"}
        </div>
      </div>
    ),
  },

  {
    accessorKey: "device",

    header: "Device",

    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.device}
        </div>

        <div className="text-xs text-muted-foreground">
          {row.original.location}
        </div>
      </div>
    ),
  },

  {
    accessorKey: "status",

    header: "Status",

    cell: ({ row }) => {
      const granted =
        row.original.status === "GRANTED"

      return (
        <Badge
          variant="outline"
          className={
            granted
              ? "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
              : "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30"
          }
        >
          {granted ? (
            <ShieldCheckIcon className="size-3 mr-1" />
          ) : (
            <ShieldXIcon className="size-3 mr-1" />
          )}

          {granted ? "Granted" : "Denied"}
        </Badge>
      )
    },
  },

  {
    accessorKey: "timestamp",

    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => column.toggleSorting()}
      >
        Time
        <ArrowUpDownIcon className="ml-1 size-3" />
      </Button>
    ),

    cell: ({ row }) => {
      const date = new Date(
        row.original.timestamp
      )

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
              year: "numeric",
            })}
          </div>
        </div>
      )
    },
  },
]

export default function AccessLogsPage() {
  const [sorting, setSorting] =
    React.useState<SortingState>([
      {
        id: "timestamp",
        desc: true,
      },
    ])

  const [statusFilter, setStatusFilter] =
    React.useState("ALL")

  const [search, setSearch] =
    React.useState("")

  const accessLogs = useQuery(
    api.accessLogs.queries.getAllAccessLogs
  )

  const data = accessLogs ?? []

  const totalGranted = data.filter(
    (log) => log.status === "GRANTED"
  ).length

  const totalDenied = data.filter(
    (log) => log.status === "DENIED"
  ).length

  const filteredData = React.useMemo(() => {
    const searchValue =
      search.toLowerCase().trim()

    return data.filter((row) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        row.status === statusFilter

      const matchesSearch =
        row.employeeName
          .toLowerCase()
          .includes(searchValue) ||
        row.device
          .toLowerCase()
          .includes(searchValue) ||
        row.employeeNumber
          ?.toLowerCase()
          .includes(searchValue)

      return matchesStatus && matchesSearch
    })
  }, [data, statusFilter, search])

  const table = useReactTable({
    data: filteredData,
    columns,

    state: {
      sorting,
    },

    onSortingChange: setSorting,

    getCoreRowModel:
      getCoreRowModel(),

    getPaginationRowModel:
      getPaginationRowModel(),

    getSortedRowModel:
      getSortedRowModel(),

    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const successRate =
    data.length > 0
      ? Math.round(
          (totalGranted / data.length) * 100
        )
      : 0

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">

      {/* Summary Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Total Events
            </CardDescription>

            <CardTitle className="text-3xl">
              {accessLogs
                ? data.length
                : "—"}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            All fingerprint scans
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Access Granted
            </CardDescription>

            <CardTitle className="text-3xl text-green-600">
              {accessLogs
                ? totalGranted
                : "—"}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            {accessLogs
              ? `${successRate}% success rate`
              : "Loading..."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Access Denied
            </CardDescription>

            <CardTitle className="text-3xl text-red-500">
              {accessLogs
                ? totalDenied
                : "—"}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Unrecognised fingerprints
          </CardContent>
        </Card>

      </div>

      {/* Table */}

      <Card>
        <CardHeader>
          <CardTitle>
            All Access Events
          </CardTitle>

          <CardDescription>
            Every fingerprint scan across all devices
          </CardDescription>
        </CardHeader>

        <CardContent>

          {/* Filters */}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">

            <Input
              placeholder="Search employee, device..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="h-8 text-sm sm:w-64"
            />

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value ?? "ALL"
                )
              }
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <FilterIcon className="size-3 mr-1" />

                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">
                  All statuses
                </SelectItem>

                <SelectItem value="GRANTED">
                  Granted
                </SelectItem>

                <SelectItem value="DENIED">
                  Denied
                </SelectItem>
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground ml-auto">
              {filteredData.length} results
            </span>

          </div>

          {/* Table */}

          <div className="rounded-md border">
            <Table>

              <TableHeader>
                {table
                  .getHeaderGroups()
                  .map((hg) => (
                    <TableRow key={hg.id}>
                      {hg.headers.map(
                        (header) => (
                          <TableHead
                            key={header.id}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header
                                    .column
                                    .columnDef
                                    .header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      )}
                    </TableRow>
                  ))}
              </TableHeader>

              <TableBody>

                {!accessLogs ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading access logs...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table
                    .getRowModel()
                    .rows
                    .map((row) => (
                      <TableRow
                        key={row.id}
                        className={
                          row.original.status ===
                          "DENIED"
                            ? "bg-red-50/40 dark:bg-red-950/10"
                            : ""
                        }
                      >
                        {row
                          .getVisibleCells()
                          .map((cell) => (
                            <TableCell
                              key={cell.id}
                            >
                              {flexRender(
                                cell.column
                                  .columnDef
                                  .cell,
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
                      No access logs found.
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
              {table.getState()
                .pagination
                .pageIndex + 1}{" "}
              of{" "}
              {Math.max(
                table.getPageCount(),
                1
              )}
            </span>

            <div className="flex items-center gap-2">

              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() =>
                  table.previousPage()
                }
                disabled={
                  !table.getCanPreviousPage()
                }
              >
                <ChevronLeftIcon className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() =>
                  table.nextPage()
                }
                disabled={
                  !table.getCanNextPage()
                }
              >
                <ChevronRightIcon className="size-4" />
              </Button>

            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  )
}
