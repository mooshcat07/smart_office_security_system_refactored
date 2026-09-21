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

// ─── Types & Data ─────────────────────────────────────────────────────────────
type AlarmSeverity = "HIGH" | "MEDIUM" | "LOW"
type AlarmStatus   = "ACTIVE" | "RESOLVED"

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

const sampleData: Alarm[] = [
  { id: "alm-001", device: "Back Office",   location: "Ground Floor", reason: "Motion detected after hours",         severity: "HIGH",   status: "ACTIVE",   triggeredAt: "2026-08-06T01:05:30Z", resolvedAt: null },
  { id: "alm-002", device: "Server Room",   location: "1st Floor",    reason: "Motion detected after hours",         severity: "HIGH",   status: "ACTIVE",   triggeredAt: "2026-08-06T01:47:18Z", resolvedAt: null },
  { id: "alm-003", device: "Main Entrance", location: "Ground Floor", reason: "Multiple denied access attempts",     severity: "MEDIUM", status: "RESOLVED", triggeredAt: "2026-08-05T10:30:00Z", resolvedAt: "2026-08-05T10:45:00Z" },
  { id: "alm-004", device: "Back Office",   location: "Ground Floor", reason: "Unrecognised fingerprint — 3 tries",  severity: "MEDIUM", status: "RESOLVED", triggeredAt: "2026-08-05T09:05:13Z", resolvedAt: "2026-08-05T09:20:00Z" },
  { id: "alm-005", device: "Server Room",   location: "1st Floor",    reason: "Motion detected after hours",         severity: "HIGH",   status: "RESOLVED", triggeredAt: "2026-08-04T22:34:18Z", resolvedAt: "2026-08-04T22:50:00Z" },
  { id: "alm-006", device: "Main Entrance", location: "Ground Floor", reason: "Motion detected after hours",         severity: "MEDIUM", status: "RESOLVED", triggeredAt: "2026-08-04T00:12:44Z", resolvedAt: "2026-08-04T00:30:00Z" },
  { id: "alm-007", device: "Back Office",   location: "Ground Floor", reason: "Multiple denied access attempts",     severity: "LOW",    status: "RESOLVED", triggeredAt: "2026-08-03T11:44:02Z", resolvedAt: "2026-08-03T12:00:00Z" },
  { id: "alm-008", device: "Server Room",   location: "1st Floor",    reason: "Unrecognised fingerprint — 3 tries",  severity: "MEDIUM", status: "RESOLVED", triggeredAt: "2026-08-03T08:14:30Z", resolvedAt: "2026-08-03T08:30:00Z" },
  { id: "alm-009", device: "Main Entrance", location: "Ground Floor", reason: "Multiple denied access attempts",     severity: "LOW",    status: "RESOLVED", triggeredAt: "2026-08-02T13:40:19Z", resolvedAt: "2026-08-02T14:00:00Z" },
  { id: "alm-010", device: "Back Office",   location: "Ground Floor", reason: "Motion detected after hours",         severity: "HIGH",   status: "RESOLVED", triggeredAt: "2026-08-01T21:12:33Z", resolvedAt: "2026-08-01T21:30:00Z" },
  { id: "alm-011", device: "Back Office",   location: "Ground Floor", reason: "Motion detected after hours",         severity: "MEDIUM", status: "ACTIVE",   triggeredAt: "2026-08-06T21:12:33Z", resolvedAt: null },
  { id: "alm-012", device: "Server Room",   location: "1st Floor",    reason: "Unrecognised fingerprint — 3 tries",  severity: "HIGH",   status: "ACTIVE",   triggeredAt: "2026-08-06T22:34:18Z", resolvedAt: null },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const severityStyles: Record<AlarmSeverity, string> = {
  HIGH:   "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30",
  MEDIUM: "text-orange-500 border-orange-300 bg-orange-50 dark:bg-orange-950/30",
  LOW:    "text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30",
}

// ─── Columns ──────────────────────────────────────────────────────────────────
const columns: ColumnDef<Alarm>[] = [
  {
    accessorKey: "device",
    header: "Device",
    cell: ({ row }) => (
      <div>
        <div className="font-medium flex items-center gap-1.5">
          <ShieldAlertIcon className="size-3.5 text-muted-foreground" />
          {row.original.device}
        </div>
        <div className="text-xs text-muted-foreground ml-5">{row.original.location}</div>
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
      <Badge variant="outline" className={severityStyles[row.original.severity]}>
        {row.original.severity}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      row.original.status === "ACTIVE" ? (
        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30 animate-pulse">
          <BellIcon className="size-3 mr-1" /> Active
        </Badge>
      ) : (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
          <CheckCircleIcon className="size-3 mr-1" /> Resolved
        </Badge>
      )
    ),
  },
  {
    accessorKey: "triggeredAt",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
        Triggered <ArrowUpDownIcon className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.triggeredAt)
      return (
        <div className="text-sm">
          <div>{date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </div>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      row.original.status === "ACTIVE" ? (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
          onClick={() => alert(`Resolve alarm ${row.original.id}`)}
        >
          <BellOffIcon className="size-3 mr-1" /> Resolve
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">
          {row.original.resolvedAt
            ? new Date(row.original.resolvedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </span>
      )
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AlarmsPage() {
  const [sorting, setSorting]     = React.useState<SortingState>([{ id: "triggeredAt", desc: true }])
  const [statusFilter, setStatus] = React.useState("ALL")
  const [severityFilter, setSev]  = React.useState("ALL")
  const [search, setSearch]       = React.useState("")

  const activeAlarms   = sampleData.filter((d) => d.status === "ACTIVE")
  const highSeverity   = sampleData.filter((d) => d.severity === "HIGH").length
  const resolvedToday  = sampleData.filter((d) => {
    if (!d.resolvedAt) return false
    return new Date(d.resolvedAt).toDateString() === new Date("2026-08-06").toDateString()
  }).length

  const filtered = React.useMemo(() => {
    return sampleData.filter((row) => {
      const matchStatus   = statusFilter === "ALL" || row.status === statusFilter
      const matchSeverity = severityFilter === "ALL" || row.severity === severityFilter
      const matchSearch   = row.device.toLowerCase().includes(search.toLowerCase())
        || row.reason.toLowerCase().includes(search.toLowerCase())
        || row.location.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSeverity && matchSearch
    })
  }, [statusFilter, severityFilter, search])

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

      {/* Active Alarm Banner */}
      {activeAlarms.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 flex items-center gap-3">
          <BellIcon className="size-5 text-red-600 animate-bounce shrink-0" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              {activeAlarms.length} active alarm{activeAlarms.length > 1 ? "s" : ""} require attention
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/70">
              {activeAlarms.map((a) => a.device).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Alarms</CardDescription>
            <CardTitle className="text-3xl text-red-500">{activeAlarms.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Currently unresolved</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High Severity</CardDescription>
            <CardTitle className="text-3xl text-orange-500">{highSeverity}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Total high severity alarms</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved Today</CardDescription>
            <CardTitle className="text-3xl text-green-600">{resolvedToday}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Cleared on Aug 6</CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Alarms</CardTitle>
          <CardDescription>Security alarm events across all devices</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <Input
              placeholder="Search device or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm sm:w-56"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatus(value ?? "ALL")}>
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
            <Select value={severityFilter} onValueChange={(value) => setSev(value ?? "ALL")}>
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
            <span className="text-sm text-muted-foreground ml-auto">{filtered.length} results</span>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
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
                      className={row.original.status === "ACTIVE" ? "bg-red-50/40 dark:bg-red-950/10" : ""}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No alarms found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
