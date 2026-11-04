"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import {
  BellIcon,
  BellOffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpDownIcon,
  FilterIcon,
  ShieldAlertIcon,
  CheckCircleIcon,
} from "lucide-react"
import { useMutation, useQuery } from "convex/react"

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
import type { Id } from "@/convex/_generated/dataModel"

// ─── Types ────────────────────────────────────────────────────────────────────
type AlarmSeverity = "HIGH" | "MEDIUM" | "LOW"
type AlarmStatus = "ACTIVE" | "RESOLVED"

type Alarm = {
  id: string
  device: string
  location: string
  reason: string
  severity: AlarmSeverity
  status: AlarmStatus
  triggeredAt: string
  resolvedAt: string | null
}

const severityStyles: Record<AlarmSeverity, string> = {
  HIGH: "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30",
  MEDIUM:
    "text-orange-500 border-orange-300 bg-orange-50 dark:bg-orange-950/30",
  LOW: "text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30",
}

// ─── Columns ──────────────────────────────────────────────────────────────────
function useColumns(
  onResolve: (id: Id<"alarmEvents">) => void,
): ColumnDef<Alarm>[] {
  return React.useMemo(
    () => [
      {
        accessorKey: "device",
        header: "Device",
        cell: ({ row }) => (
          <div>
            <div className="font-medium flex items-center gap-1.5">
              <ShieldAlertIcon className="size-3.5 text-muted-foreground" />
              {row.original.device}
            </div>
            <div className="text-xs text-muted-foreground ml-5">
              {row.original.location}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.reason}</span>
        ),
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={severityStyles[row.original.severity]}
          >
            {row.original.severity}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.status === "ACTIVE" ? (
            <Badge
              variant="outline"
              className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30 animate-pulse"
            >
              <BellIcon className="size-3 mr-1" /> Active
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
            >
              <CheckCircleIcon className="size-3 mr-1" /> Resolved
            </Badge>
          ),
      },
      {
        accessorKey: "triggeredAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting()}
          >
            Triggered <ArrowUpDownIcon className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.original.triggeredAt)
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
      {
        id: "actions",
        cell: ({ row }) =>
          row.original.status === "ACTIVE" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
              onClick={() =>
                onResolve(row.original.id as Id<"alarmEvents">)
              }
            >
              <BellOffIcon className="size-3 mr-1" /> Resolve
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {row.original.resolvedAt
                ? new Date(row.original.resolvedAt).toLocaleTimeString(
                    "en-GB",
                    { hour: "2-digit", minute: "2-digit" },
                  )
                : "—"}
            </span>
          ),
      },
    ],
    [onResolve],
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AlarmsPage() {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "triggeredAt", desc: true },
  ])
  const [statusFilter, setStatus] = React.useState("ALL")
  const [severityFilter, setSev] = React.useState("ALL")
  const [search, setSearch] = React.useState("")

  const alarms = useQuery(api.alarmEvents.queries.getAllAlarms)
  const resolveAlarm = useMutation(api.alarmEvents.mutations.resolveAlarm)

  const data: Alarm[] = (alarms ?? []) as Alarm[]

  const handleResolve = React.useCallback(
    async (id: Id<"alarmEvents">) => {
      try {
        await resolveAlarm({ alarmEventId: id })
      } catch (err) {
        console.error("Failed to resolve alarm", err)
      }
    },
    [resolveAlarm],
  )

  const columns = useColumns(handleResolve)

  const activeAlarms = data.filter((d) => d.status === "ACTIVE")
  const highSeverity = data.filter((d) => d.severity === "HIGH").length
  const resolvedToday = data.filter((d) => {
    if (!d.resolvedAt) return false
    const resolved = new Date(d.resolvedAt)
    const now = new Date()
    return (
      resolved.getFullYear() === now.getFullYear() &&
      resolved.getMonth() === now.getMonth() &&
      resolved.getDate() === now.getDate()
    )
  }).length

  const deviceNames = React.useMemo(() => {
    const set = new Set(data.map((d) => d.device))
    return Array.from(set).sort()
  }, [data])

  const filtered = React.useMemo(() => {
    return data.filter((row) => {
      const matchStatus =
        statusFilter === "ALL" || row.status === statusFilter
      const matchSev =
        severityFilter === "ALL" || row.severity === severityFilter
      const matchSearch =
        row.device.toLowerCase().includes(search.toLowerCase()) ||
        row.location.toLowerCase().includes(search.toLowerCase()) ||
        row.reason.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSev && matchSearch
    })
  }, [data, statusFilter, severityFilter, search])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Alarms</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {activeAlarms.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Require immediate attention
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Severity</CardDescription>
            <CardTitle className="text-3xl text-orange-500">
              {highSeverity}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            All-time high severity count
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved Today</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {resolvedToday}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cleared in the last 24 hours
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Alarms</CardTitle>
          <CardDescription>
            Security alerts generated from motion and access events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <Input
              placeholder="Search device, location or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm sm:w-64"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatus(value ?? "ALL")}
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <FilterIcon className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={severityFilter}
              onValueChange={(value) => setSev(value ?? "ALL")}
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All severities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} results
            </span>
          </div>

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
                              h.getContext(),
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
                        row.original.status === "ACTIVE"
                          ? "bg-red-50/40 dark:bg-red-950/10"
                          : ""
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
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
                      {alarms === undefined
                        ? "Loading…"
                        : "No alarms found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
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
        </CardContent>
      </Card>
    </div>
  )
}
