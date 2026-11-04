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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

// ─── Types ────────────────────────────────────────────────────────────────────
type MotionEvent = {
  id: string
  device: string
  location: string
  detectedAt: string
  resolved: boolean
  resolvedAt: string | null
}

const chartConfig = {
  events: { label: "Motion Events", color: "var(--primary)" },
} satisfies ChartConfig

// ─── Columns (defined inside component so resolve handler is in scope) ───────
function useColumns(
  onResolve: (id: Id<"motionEvents">) => void,
): ColumnDef<MotionEvent>[] {
  return React.useMemo(
    () => [
      {
        accessorKey: "device",
        header: "Device",
        cell: ({ row }) => (
          <div>
            <div className="font-medium flex items-center gap-1.5">
              <ActivityIcon className="size-3.5 text-muted-foreground" />
              {row.original.device}
            </div>
            <div className="text-xs text-muted-foreground ml-5">
              {row.original.location}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "detectedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting()}
          >
            Detected At <ArrowUpDownIcon className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.original.detectedAt)
          const hour = date.getHours()
          const isAfterHours = hour < 7 || hour >= 18
          return (
            <div className="text-sm">
              <div>
                {date.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div
                className={`text-xs ${
                  isAfterHours
                    ? "text-orange-500 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {isAfterHours
                  ? "⚠ After hours"
                  : date.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "resolved",
        header: "Status",
        cell: ({ row }) =>
          row.original.resolved ? (
            <Badge
              variant="outline"
              className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
            >
              <CheckCircleIcon className="size-3 mr-1" /> Resolved
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-orange-500 border-orange-300 bg-orange-50 dark:bg-orange-950/30"
            >
              <CircleAlertIcon className="size-3 mr-1" /> Unresolved
            </Badge>
          ),
      },
      {
        id: "actions",
        cell: ({ row }) =>
          !row.original.resolved ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() =>
                onResolve(row.original.id as Id<"motionEvents">)
              }
            >
              Mark Resolved
            </Button>
          ) : null,
      },
    ],
    [onResolve],
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MotionEventsPage() {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "detectedAt", desc: true },
  ])
  const [statusFilter, setStatus] = React.useState("ALL")
  const [deviceFilter, setDevice] = React.useState("ALL")
  const [search, setSearch] = React.useState("")

  const motionEvents = useQuery(api.motionEvents.queries.getAllMotionEvents)
  const hourlyData = useQuery(api.motionEvents.queries.getMotionHourlyToday)
  const resolveMotion = useMutation(
    api.motionEvents.mutations.resolveMotionEvent,
  )

  const data: MotionEvent[] = motionEvents ?? []
  const chartData = hourlyData ?? []

  const handleResolve = React.useCallback(
    async (id: Id<"motionEvents">) => {
      try {
        await resolveMotion({ motionEventId: id })
      } catch (err) {
        console.error("Failed to resolve motion event", err)
      }
    },
    [resolveMotion],
  )

  const columns = useColumns(handleResolve)

  const totalUnresolved = data.filter((d) => !d.resolved).length
  const afterHours = data.filter((d) => {
    const h = new Date(d.detectedAt).getHours()
    return h < 7 || h >= 18
  }).length

  // Unique device names for the filter dropdown
  const deviceNames = React.useMemo(() => {
    const set = new Set(data.map((d) => d.device))
    return Array.from(set).sort()
  }, [data])

  const filtered = React.useMemo(() => {
    return data.filter((row) => {
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "RESOLVED" && row.resolved) ||
        (statusFilter === "UNRESOLVED" && !row.resolved)
      const matchDevice =
        deviceFilter === "ALL" || row.device === deviceFilter
      const matchSearch =
        row.device.toLowerCase().includes(search.toLowerCase()) ||
        row.location.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchDevice && matchSearch
    })
  }, [data, statusFilter, deviceFilter, search])

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
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-3xl">{data.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            All PIR sensor triggers
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unresolved</CardDescription>
            <CardTitle className="text-3xl text-orange-500">
              {totalUnresolved}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Require attention
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>After-Hours Events</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {afterHours}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Detected outside 07:00–18:00
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Motion Events by Hour</CardTitle>
          <CardDescription>
            PIR sensor triggers throughout today (CAT)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-50 w-full">
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                interval={2}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="events"
                fill="var(--color-events)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Motion Events</CardTitle>
          <CardDescription>
            Every PIR sensor trigger across all devices
          </CardDescription>
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
            <Select
              value={deviceFilter}
              onValueChange={(value) => setDevice(value ?? "ALL")}
            >
              <SelectTrigger className="h-8 w-40 text-sm">
                <FilterIcon className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All devices</SelectItem>
                {deviceNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatus(value ?? "ALL")}
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="UNRESOLVED">Unresolved</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
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
                        !row.original.resolved
                          ? "bg-orange-50/40 dark:bg-orange-950/10"
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
                      {motionEvents === undefined
                        ? "Loading…"
                        : "No motion events yet."}
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
