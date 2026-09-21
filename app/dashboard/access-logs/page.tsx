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
  type ColumnFiltersState,
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

// ─── Sample Data ────────────────────────────────────────────────────────────
type AccessLog = {
  id: string
  employeeName: string
  employeeNumber: string | null
  device: string
  location: string
  status: "GRANTED" | "DENIED"
  timestamp: string
}

const sampleData: AccessLog[] = [
  { id: "log-001", employeeName: "Chisomo Banda",    employeeNumber: "EMP001", device: "Main Entrance", location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T07:02:11Z" },
  { id: "log-002", employeeName: "Takondwa Phiri",   employeeNumber: "EMP002", device: "Server Room",   location: "1st Floor",    status: "GRANTED", timestamp: "2026-08-06T07:15:44Z" },
  { id: "log-003", employeeName: "Unknown",          employeeNumber: null,     device: "Main Entrance", location: "Ground Floor", status: "DENIED",  timestamp: "2026-08-06T07:31:09Z" },
  { id: "log-004", employeeName: "Wongani Mwale",    employeeNumber: "EMP003", device: "Main Entrance", location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T07:45:22Z" },
  { id: "log-005", employeeName: "Chimwemwe Dube",   employeeNumber: "EMP004", device: "Back Office",   location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T08:01:55Z" },
  { id: "log-006", employeeName: "Unknown",          employeeNumber: null,     device: "Server Room",   location: "1st Floor",    status: "DENIED",  timestamp: "2026-08-06T08:14:30Z" },
  { id: "log-007", employeeName: "Mphatso Tembo",    employeeNumber: "EMP005", device: "Main Entrance", location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T08:22:17Z" },
  { id: "log-008", employeeName: "Alinafe Kachule",  employeeNumber: "EMP006", device: "Back Office",   location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T08:35:40Z" },
  { id: "log-009", employeeName: "Unknown",          employeeNumber: null,     device: "Back Office",   location: "Ground Floor", status: "DENIED",  timestamp: "2026-08-06T09:05:13Z" },
  { id: "log-010", employeeName: "Thandizo Lungu",   employeeNumber: "EMP007", device: "Main Entrance", location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T09:18:02Z" },
  { id: "log-011", employeeName: "Chisomo Banda",    employeeNumber: "EMP001", device: "Server Room",   location: "1st Floor",    status: "GRANTED", timestamp: "2026-08-06T09:44:29Z" },
  { id: "log-012", employeeName: "Kondwani Nkosi",   employeeNumber: "EMP008", device: "Main Entrance", location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T10:02:50Z" },
  { id: "log-013", employeeName: "Unknown",          employeeNumber: null,     device: "Main Entrance", location: "Ground Floor", status: "DENIED",  timestamp: "2026-08-06T10:30:00Z" },
  { id: "log-014", employeeName: "Wongani Mwale",    employeeNumber: "EMP003", device: "Back Office",   location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T10:55:18Z" },
  { id: "log-015", employeeName: "Takondwa Phiri",   employeeNumber: "EMP002", device: "Main Entrance", location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T11:10:33Z" },
  { id: "log-016", employeeName: "Unknown",          employeeNumber: null,     device: "Server Room",   location: "1st Floor",    status: "DENIED",  timestamp: "2026-08-06T11:45:00Z" },
  { id: "log-017", employeeName: "Mphatso Tembo",    employeeNumber: "EMP005", device: "Back Office",   location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T12:03:22Z" },
  { id: "log-018", employeeName: "Alinafe Kachule",  employeeNumber: "EMP006", device: "Main Entrance", location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T12:30:10Z" },
  { id: "log-019", employeeName: "Chimwemwe Dube",   employeeNumber: "EMP004", device: "Server Room",   location: "1st Floor",    status: "GRANTED", timestamp: "2026-08-06T13:05:44Z" },
  { id: "log-020", employeeName: "Unknown",          employeeNumber: null,     device: "Main Entrance", location: "Ground Floor", status: "DENIED",  timestamp: "2026-08-06T13:40:19Z" },
  { id: "log-021", employeeName: "Thandizo Lungu",   employeeNumber: "EMP007", device: "Back Office",   location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T14:00:05Z" },
  { id: "log-022", employeeName: "Kondwani Nkosi",   employeeNumber: "EMP008", device: "Server Room",   location: "1st Floor",    status: "GRANTED", timestamp: "2026-08-06T14:22:33Z" },
  { id: "log-023", employeeName: "Unknown",          employeeNumber: null,     device: "Back Office",   location: "Ground Floor", status: "DENIED",  timestamp: "2026-08-06T15:10:47Z" },
  { id: "log-024", employeeName: "Chisomo Banda",    employeeNumber: "EMP001", device: "Main Entrance", location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T15:45:00Z" },
  { id: "log-025", employeeName: "Takondwa Phiri",   employeeNumber: "EMP002", device: "Back Office",   location: "Ground Floor", status: "GRANTED", timestamp: "2026-08-06T16:12:08Z" },
]

// ─── Stats ───────────────────────────────────────────────────────────────────
const totalGranted = sampleData.filter((d) => d.status === "GRANTED").length
const totalDenied  = sampleData.filter((d) => d.status === "DENIED").length

// ─── Columns ─────────────────────────────────────────────────────────────────
const columns: ColumnDef<AccessLog>[] = [
  {
    accessorKey: "employeeName",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
        Employee <ArrowUpDownIcon className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.employeeName}</div>
        <div className="text-xs text-muted-foreground">{row.original.employeeNumber ?? "—"}</div>
      </div>
    ),
  },
  {
    accessorKey: "device",
    header: "Device",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.device}</div>
        <div className="text-xs text-muted-foreground">{row.original.location}</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const granted = row.original.status === "GRANTED"
      return (
        <Badge
          variant="outline"
          className={
            granted
              ? "text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
              : "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30"
          }
        >
          {granted
            ? <ShieldCheckIcon className="size-3 mr-1" />
            : <ShieldXIcon className="size-3 mr-1" />}
          {granted ? "Granted" : "Denied"}
        </Badge>
      )
    },
    filterFn: (row, _, value) => value === "ALL" || row.original.status === value,
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={() => column.toggleSorting()}>
        Time <ArrowUpDownIcon className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.timestamp)
      return (
        <div className="text-sm">
          <div>{date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      )
    },
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AccessLogsPage() {
  const [sorting, setSorting]           = React.useState<SortingState>([{ id: "timestamp", desc: true }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [statusFilter, setStatusFilter] = React.useState("ALL")
  const [search, setSearch]             = React.useState("")

  const filteredData = React.useMemo(() => {
    return sampleData.filter((row) => {
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter
      const matchesSearch =
        row.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        row.device.toLowerCase().includes(search.toLowerCase()) ||
        (row.employeeNumber ?? "").toLowerCase().includes(search.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [statusFilter, search])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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
            <CardTitle className="text-3xl">{sampleData.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">All scans today</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Access Granted</CardDescription>
            <CardTitle className="text-3xl text-green-600">{totalGranted}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {Math.round((totalGranted / sampleData.length) * 100)}% success rate
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Access Denied</CardDescription>
            <CardTitle className="text-3xl text-red-500">{totalDenied}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Unrecognised fingerprints
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Access Events</CardTitle>
          <CardDescription>Every fingerprint scan across all devices</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <Input
              placeholder="Search employee, device..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm sm:w-64"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "ALL")}>
              <SelectTrigger className="h-8 w-36 text-sm">
                <FilterIcon className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="GRANTED">Granted</SelectItem>
                <SelectItem value="DENIED">Denied</SelectItem>
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
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
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
                        row.original.status === "DENIED"
                          ? "bg-red-50/40 dark:bg-red-950/10"
                          : ""
                      }
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
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" className="h-7 w-7 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline" size="sm" className="h-7 w-7 p-0"
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
