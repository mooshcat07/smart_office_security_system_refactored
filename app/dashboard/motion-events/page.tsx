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
  ActivityIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpDownIcon,
  FilterIcon,
  CheckCircleIcon,
  CircleAlertIcon,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

// ─── Types & Data ─────────────────────────────────────────────────────────────
type MotionEvent = {
  id: string
  device: string
  location: string
  detectedAt: string
  resolved: boolean
}

const sampleData: MotionEvent[] = [
  { id: "mot-001", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T00:12:44Z", resolved: true  },
  { id: "mot-002", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T01:05:30Z", resolved: false },
  { id: "mot-003", device: "Server Room",   location: "1st Floor",    detectedAt: "2026-08-06T01:47:18Z", resolved: false },
  { id: "mot-004", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T02:33:05Z", resolved: true  },
  { id: "mot-005", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T03:14:52Z", resolved: true  },
  { id: "mot-006", device: "Server Room",   location: "1st Floor",    detectedAt: "2026-08-06T04:02:09Z", resolved: true  },
  { id: "mot-007", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T04:58:37Z", resolved: true  },
  { id: "mot-008", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T05:41:21Z", resolved: true  },
  { id: "mot-009", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T06:23:44Z", resolved: true  },
  { id: "mot-010", device: "Server Room",   location: "1st Floor",    detectedAt: "2026-08-06T07:15:00Z", resolved: true  },
  { id: "mot-011", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T08:02:33Z", resolved: true  },
  { id: "mot-012", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T09:11:19Z", resolved: true  },
  { id: "mot-013", device: "Server Room",   location: "1st Floor",    detectedAt: "2026-08-06T10:05:48Z", resolved: true  },
  { id: "mot-014", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T11:44:02Z", resolved: true  },
  { id: "mot-015", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T12:30:17Z", resolved: true  },
  { id: "mot-016", device: "Server Room",   location: "1st Floor",    detectedAt: "2026-08-06T13:22:55Z", resolved: true  },
  { id: "mot-017", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T14:08:40Z", resolved: true  },
  { id: "mot-018", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T15:19:11Z", resolved: true  },
  { id: "mot-019", device: "Server Room",   location: "1st Floor",    detectedAt: "2026-08-06T16:55:29Z", resolved: true  },
  { id: "mot-020", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T18:03:44Z", resolved: true  },
  { id: "mot-021", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T19:47:06Z", resolved: true  },
  { id: "mot-022", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T21:12:33Z", resolved: false },
  { id: "mot-023", device: "Server Room",   location: "1st Floor",    detectedAt: "2026-08-06T22:34:18Z", resolved: false },
  { id: "mot-024", device: "Main Entrance", location: "Ground Floor", detectedAt: "2026-08-06T23:05:50Z", resolved: true  },
  { id: "mot-025", device: "Back Office",   location: "Ground Floor", detectedAt: "2026-08-06T23:48:22Z", resolved: false },
]

// ─── Bar chart data — events per hour bucket ──────────────────────────────────
const hourlyData = [
  { hour: "00:00", events: 1 },
  { hour: "01:00", events: 2 },
  { hour: "02:00", events: 1 },
  { hour: "03:00", events: 1 },
  { hour: "04:00", events: 2 },
  { hour: "05:00", events: 1 },
  { hour: "06:00", events: 1 },
  { hour: "07:00", events: 1 },
  { hour: "08:00", events: 1 },
  { hour: "09:00", events: 1 },
  { hour: "10:00", events: 1 },
  { hour: "11:00", events: 1 },
  { hour: "12:00", events: 1 },
  { hour: "13:00", events: 1 },
  { hour: "14:00", events: 1 },
  { hour: "15:00", events: 1 },
  { hour: "16:00", events: 1 },
  { hour: "17:00", events: 0 },
  { hour: "18:00", events: 1 },
  { hour: "19:00", events: 1 },
  { hour: "20:00", events: 0 },
  { hour: "21:00", events: 1 },
  { hour: "22:00", events: 1 },
  { hour: "23:00", events: 2 },
]

const chartConfig = {
  events: { label: "Motion Events", color: "var(--primary)" },
} satisfies ChartConfig

// ─── Columns ──────────────────────────────────────────────────────────────────
const columns: ColumnDef<MotionEvent>[] = [
  {
    accessorKey: "device",
    header: "Device",
    cell: ({ row }) => (
      <div>
        <div className="font-medium flex items-center gap-1.5">
          <ActivityIcon className="size-3.5 text-muted-foreground" />
          {row.original.device}
        </div>
        <div className="text-xs text-muted-foreground ml-5">{row.original.location}</div>
      </div>
    ),
  },
  {
    accessorKey: "detectedAt",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
        Detected At <ArrowUpDownIcon className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.detectedAt)
      const hour = date.getHours()
      const isAfterHours = hour < 7 || hour >= 18
      return (
        <div className="text-sm">
          <div>{date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          <div className={`text-xs ${isAfterHours ? "text-orange-500 font-medium" : "text-muted-foreground"}`}>
            {isAfterHours ? "⚠ After hours" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "resolved",
    header: "Status",
    cell: ({ row }) => (
      row.original.resolved ? (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
          <CheckCircleIcon className="size-3 mr-1" /> Resolved
        </Badge>
      ) : (
        <Badge variant="outline" className="text-orange-500 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
          <CircleAlertIcon className="size-3 mr-1" /> Unresolved
        </Badge>
      )
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      !row.original.resolved ? (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => alert(`Mark ${row.original.id} as resolved`)}
        >
          Mark Resolved
        </Button>
      ) : null
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MotionEventsPage() {
  const [sorting, setSorting]       = React.useState<SortingState>([{ id: "detectedAt", desc: true }])
  const [statusFilter, setStatus]   = React.useState("ALL")
  const [deviceFilter, setDevice]   = React.useState("ALL")
  const [search, setSearch]         = React.useState("")

  const totalUnresolved = sampleData.filter((d) => !d.resolved).length
  const afterHours      = sampleData.filter((d) => {
    const h = new Date(d.detectedAt).getHours()
    return h < 7 || h >= 18
  }).length

  const filtered = React.useMemo(() => {
    return sampleData.filter((row) => {
      const matchStatus = statusFilter === "ALL"
        || (statusFilter === "RESOLVED"   &&  row.resolved)
        || (statusFilter === "UNRESOLVED" && !row.resolved)
      const matchDevice = deviceFilter === "ALL" || row.device === deviceFilter
      const matchSearch = row.device.toLowerCase().includes(search.toLowerCase())
        || row.location.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchDevice && matchSearch
    })
  }, [statusFilter, deviceFilter, search])

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
            <CardDescription>Total Events Today</CardDescription>
            <CardTitle className="text-3xl">{sampleData.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">All PIR sensor triggers</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unresolved</CardDescription>
            <CardTitle className="text-3xl text-orange-500">{totalUnresolved}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Require attention</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>After-Hours Events</CardDescription>
            <CardTitle className="text-3xl text-red-500">{afterHours}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Detected outside 07:00–18:00</CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Motion Events by Hour</CardTitle>
          <CardDescription>PIR sensor triggers throughout today</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={hourlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} interval={2} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="events" fill="var(--color-events)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Motion Events</CardTitle>
          <CardDescription>Every PIR sensor trigger across all devices</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <Input
              placeholder="Search device or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm sm:w-56"
            />
            <Select value={deviceFilter} onValueChange={(value) => setDevice(value ?? "ALL")}>
              <SelectTrigger className="h-8 w-40 text-sm">
                <FilterIcon className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All devices</SelectItem>
                <SelectItem value="Main Entrance">Main Entrance</SelectItem>
                <SelectItem value="Back Office">Back Office</SelectItem>
                <SelectItem value="Server Room">Server Room</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatus(value ?? "ALL")}>
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="UNRESOLVED">Unresolved</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
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
                      className={!row.original.resolved ? "bg-orange-50/40 dark:bg-orange-950/10" : ""}
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
                      No results found.
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
