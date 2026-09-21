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
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ShieldCheckIcon, ShieldXIcon } from "lucide-react"

export const accessLogSchema = z.object({
  id: z.string(),
  employeeName: z.string(),
  employeeNumber: z.string().nullable(),
  device: z.string(),
  location: z.string(),
  status: z.enum(["GRANTED", "DENIED"]),
  timestamp: z.string(),
})

export type AccessLog = z.infer<typeof accessLogSchema>

export const columns: ColumnDef<AccessLog>[] = [
  {
    accessorKey: "employeeName",
    header: "Employee",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.employeeName}</div>
        {row.original.employeeNumber && (
          <div className="text-xs text-muted-foreground">{row.original.employeeNumber}</div>
        )}
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
    header: "Time",
    cell: ({ row }) => {
      const date = new Date(row.original.timestamp)
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          <div className="text-xs">{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
        </div>
      )
    },
  },
]

export function DataTable({ data }: { data: AccessLog[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "timestamp", desc: true }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  })

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between py-4 gap-2">
        <div>
          <h2 className="text-base font-semibold">Recent Access Logs</h2>
          <p className="text-sm text-muted-foreground">All fingerprint scan events</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search employee..."
            value={(table.getColumn("employeeName")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("employeeName")?.setFilterValue(e.target.value)}
            className="h-8 w-48 text-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-8" />}>
              Columns <ChevronDownIcon className="ml-1 size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(val) => col.toggleVisibility(!!val)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={row.original.status === "DENIED" ? "bg-red-50/30 dark:bg-red-950/10" : ""}>
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
                  No access logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
        <span>{table.getFilteredRowModel().rows.length} total events</span>
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
          <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
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
    </div>
  )
}
