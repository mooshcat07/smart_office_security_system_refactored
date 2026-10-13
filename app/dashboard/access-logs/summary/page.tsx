"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts"
import { ArrowLeftIcon, UsersIcon } from "lucide-react"

import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const chartConfig = {
  totalHours: {
    label: "Hours on site",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function formatDuration(ms: number) {
  const totalMinutes = Math.max(Math.round(ms / 60000), 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function formatTime(iso: string | null) {
  if (!iso) return "—"

  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDay(date: string, long = false) {
  // "YYYY-MM-DD" is a calendar day already in CAT; render it as-is
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: long ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: long ? "numeric" : undefined,
    timeZone: "UTC",
  })
}

export default function AccessSummaryPage() {
  const [range, setRange] = React.useState("7")
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null)

  const summary = useQuery(api.accessLogs.queries.getAttendanceSummary, {
    days: Number(range),
  })

  const days = summary?.days

  // Default to today; fall back if the chosen day left the window
  const selectedDay = React.useMemo(() => {
    if (!days || days.length === 0) return null

    return (
      days.find((d) => d.date === selectedDate) ?? days[days.length - 1]
    )
  }, [days, selectedDate])

  const totals = React.useMemo(() => {
    if (!days) return null

    const totalMs = days.reduce((sum, d) => sum + d.totalMs, 0)
    const visits = days.reduce((sum, d) => sum + d.visits, 0)

    return {
      visits,
      averageMs: visits > 0 ? totalMs / visits : 0,
    }
  }, [days])

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <Link
          href="/dashboard/access-logs"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeftIcon className="size-4" />
          Back to access logs
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Currently Inside</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {summary ? summary.currentlyInside : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Entered today, not yet exited
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visits</CardDescription>
            <CardTitle className="text-3xl">
              {totals ? totals.visits : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Entries in the last {range} days
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Stay</CardDescription>
            <CardTitle className="text-3xl">
              {totals ? formatDuration(totals.averageMs) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Per completed visit
          </CardContent>
        </Card>
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Time on Site</CardTitle>
          <CardDescription>
            Total hours staff spent in the office each day. Click a bar to
            see who was in.
          </CardDescription>

          <CardAction>
            <ToggleGroup
              multiple={false}
              value={[range]}
              onValueChange={(value) => setRange(value[0] ?? "7")}
              variant="outline"
            >
              <ToggleGroupItem value="7">7 days</ToggleGroupItem>
              <ToggleGroupItem value="14">14 days</ToggleGroupItem>
              <ToggleGroupItem value="30">30 days</ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {!days ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Loading summary...
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[280px] w-full cursor-pointer"
            >
              <BarChart
                data={days}
                onClick={(state) => {
                  const index = Number(state?.activeIndex)
                  const day = Number.isInteger(index) ? days[index] : undefined
                  if (day) setSelectedDate(day.date)
                }}
              >
                <CartesianGrid vertical={false} />

                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  tickFormatter={(value: string) => formatDay(value)}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tickFormatter={(value: number) => `${value}h`}
                />

                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                  content={({ active, payload }) => {
                    const day = payload?.[0]?.payload as
                      | (typeof days)[number]
                      | undefined

                    if (!active || !day) return null

                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                        <div className="mb-1 font-medium">
                          {formatDay(day.date, true)}
                        </div>
                        <div>{formatDuration(day.totalMs)} on site</div>
                        <div className="text-muted-foreground">
                          {day.peopleCount}{" "}
                          {day.peopleCount === 1 ? "person" : "people"},{" "}
                          {day.visits} {day.visits === 1 ? "visit" : "visits"}
                        </div>
                      </div>
                    )
                  }}
                />

                <Bar
                  dataKey="totalHours"
                  radius={[4, 4, 0, 0]}
                  shape={(props: BarShapeProps) => {
                    const day = props.payload as { date: string }
                    const isSelected = day.date === selectedDay?.date

                    return (
                      <Rectangle
                        {...props}
                        fill="var(--color-totalHours)"
                        fillOpacity={isSelected ? 1 : 0.45}
                      />
                    )
                  }}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Day detail table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDay
              ? formatDay(selectedDay.date, true)
              : "Select a day"}
          </CardTitle>
          <CardDescription>
            {selectedDay
              ? `${selectedDay.peopleCount} ${
                  selectedDay.peopleCount === 1 ? "person" : "people"
                } on site, ${formatDuration(selectedDay.totalMs)} in total`
              : "Click a bar above to see who was in that day"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>First In</TableHead>
                  <TableHead>Last Out</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Time Inside</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!selectedDay ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : selectedDay.people.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <UsersIcon className="mx-auto mb-2 size-5" />
                      Nobody entered on this day.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedDay.people.map((person) => (
                    <TableRow key={person.fingerprintId}>
                      <TableCell>
                        <div className="font-medium">{person.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {person.employeeNumber ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>{formatTime(person.firstEntry)}</TableCell>
                      <TableCell>{formatTime(person.lastExit)}</TableCell>
                      <TableCell>{person.visits}</TableCell>
                      <TableCell className="font-medium">
                        {person.totalMs > 0
                          ? formatDuration(person.totalMs)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {person.stillInside ? (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30"
                          >
                            Inside
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-gray-600 border-gray-300 bg-gray-50 dark:bg-gray-900/30"
                          >
                            {person.lastExit ? "Left" : "No exit scan"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
