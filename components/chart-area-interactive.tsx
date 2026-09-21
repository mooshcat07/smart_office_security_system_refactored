"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

// Sample access event data for the last 90 days
const chartData = [
  { date: "2026-05-08", granted: 18, denied: 2 },
  { date: "2026-05-09", granted: 22, denied: 1 },
  { date: "2026-05-10", granted: 15, denied: 3 },
  { date: "2026-05-11", granted: 0, denied: 0 },
  { date: "2026-05-12", granted: 0, denied: 0 },
  { date: "2026-05-13", granted: 25, denied: 4 },
  { date: "2026-05-14", granted: 19, denied: 2 },
  { date: "2026-05-15", granted: 21, denied: 1 },
  { date: "2026-05-16", granted: 17, denied: 5 },
  { date: "2026-05-17", granted: 0, denied: 0 },
  { date: "2026-05-18", granted: 0, denied: 0 },
  { date: "2026-05-19", granted: 24, denied: 3 },
  { date: "2026-05-20", granted: 20, denied: 2 },
  { date: "2026-05-21", granted: 18, denied: 1 },
  { date: "2026-05-22", granted: 23, denied: 4 },
  { date: "2026-05-23", granted: 16, denied: 2 },
  { date: "2026-05-24", granted: 0, denied: 0 },
  { date: "2026-05-25", granted: 0, denied: 0 },
  { date: "2026-05-26", granted: 27, denied: 3 },
  { date: "2026-05-27", granted: 22, denied: 1 },
  { date: "2026-05-28", granted: 19, denied: 2 },
  { date: "2026-05-29", granted: 21, denied: 6 },
  { date: "2026-05-30", granted: 18, denied: 1 },
  { date: "2026-05-31", granted: 0, denied: 0 },
  { date: "2026-06-01", granted: 0, denied: 0 },
  { date: "2026-06-02", granted: 26, denied: 2 },
  { date: "2026-06-03", granted: 20, denied: 3 },
  { date: "2026-06-04", granted: 23, denied: 1 },
  { date: "2026-06-05", granted: 18, denied: 4 },
  { date: "2026-06-06", granted: 22, denied: 2 },
  { date: "2026-06-07", granted: 0, denied: 0 },
  { date: "2026-06-08", granted: 0, denied: 0 },
  { date: "2026-06-09", granted: 25, denied: 3 },
  { date: "2026-06-10", granted: 21, denied: 1 },
  { date: "2026-06-11", granted: 17, denied: 5 },
  { date: "2026-06-12", granted: 24, denied: 2 },
  { date: "2026-06-13", granted: 19, denied: 3 },
  { date: "2026-06-14", granted: 0, denied: 0 },
  { date: "2026-06-15", granted: 0, denied: 0 },
  { date: "2026-06-16", granted: 28, denied: 4 },
  { date: "2026-06-17", granted: 22, denied: 2 },
  { date: "2026-06-18", granted: 20, denied: 1 },
  { date: "2026-06-19", granted: 18, denied: 3 },
  { date: "2026-06-20", granted: 23, denied: 2 },
  { date: "2026-06-21", granted: 0, denied: 0 },
  { date: "2026-06-22", granted: 0, denied: 0 },
  { date: "2026-06-23", granted: 26, denied: 5 },
  { date: "2026-06-24", granted: 21, denied: 1 },
  { date: "2026-06-25", granted: 19, denied: 2 },
  { date: "2026-06-26", granted: 24, denied: 3 },
  { date: "2026-06-27", granted: 20, denied: 1 },
  { date: "2026-06-28", granted: 0, denied: 0 },
  { date: "2026-06-29", granted: 0, denied: 0 },
  { date: "2026-06-30", granted: 27, denied: 4 },
  { date: "2026-07-01", granted: 23, denied: 2 },
  { date: "2026-07-02", granted: 18, denied: 3 },
  { date: "2026-07-03", granted: 21, denied: 1 },
  { date: "2026-07-04", granted: 0, denied: 0 },
  { date: "2026-07-05", granted: 0, denied: 0 },
  { date: "2026-07-06", granted: 25, denied: 5 },
  { date: "2026-07-07", granted: 22, denied: 2 },
  { date: "2026-07-08", granted: 19, denied: 3 },
  { date: "2026-07-09", granted: 24, denied: 1 },
  { date: "2026-07-10", granted: 20, denied: 4 },
  { date: "2026-07-11", granted: 0, denied: 0 },
  { date: "2026-07-12", granted: 0, denied: 0 },
  { date: "2026-07-13", granted: 28, denied: 3 },
  { date: "2026-07-14", granted: 23, denied: 2 },
  { date: "2026-07-15", granted: 17, denied: 6 },
  { date: "2026-07-16", granted: 22, denied: 1 },
  { date: "2026-07-17", granted: 20, denied: 2 },
  { date: "2026-07-18", granted: 0, denied: 0 },
  { date: "2026-07-19", granted: 0, denied: 0 },
  { date: "2026-07-20", granted: 26, denied: 4 },
  { date: "2026-07-21", granted: 21, denied: 2 },
  { date: "2026-07-22", granted: 19, denied: 1 },
  { date: "2026-07-23", granted: 23, denied: 3 },
  { date: "2026-07-24", granted: 18, denied: 2 },
  { date: "2026-07-25", granted: 0, denied: 0 },
  { date: "2026-07-26", granted: 0, denied: 0 },
  { date: "2026-07-27", granted: 27, denied: 5 },
  { date: "2026-07-28", granted: 24, denied: 2 },
  { date: "2026-07-29", granted: 20, denied: 3 },
  { date: "2026-07-30", granted: 22, denied: 1 },
  { date: "2026-07-31", granted: 19, denied: 4 },
  { date: "2026-08-01", granted: 0, denied: 0 },
  { date: "2026-08-02", granted: 0, denied: 0 },
  { date: "2026-08-03", granted: 25, denied: 3 },
  { date: "2026-08-04", granted: 21, denied: 2 },
  { date: "2026-08-05", granted: 23, denied: 4 },
  { date: "2026-08-06", granted: 19, denied: 4 },
]

const chartConfig = {
  granted: {
    label: "Granted",
    color: "var(--primary)",
  },
  denied: {
    label: "Denied",
    color: "oklch(0.637 0.237 25.331)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  // Reset to a 7-day view the moment we cross onto mobile. Adjusting state
  // during render (instead of in an effect) avoids the extra render pass -
  // see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevIsMobile, setPrevIsMobile] = React.useState(isMobile)
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile)
    if (isMobile) setTimeRange("7d")
  }

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2026-08-06")
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    else if (timeRange === "7d") daysToSubtract = 7
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Access Events Over Time</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Granted vs denied fingerprint scans
          </span>
          <span className="@[540px]/card:hidden">Granted vs denied</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => setTimeRange(value[0] ?? "90d")}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => { if (value) setTimeRange(value) }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
              <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
              <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillGranted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-granted)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-granted)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillDenied" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-denied)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-denied)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                  indicator="dot"
                />
              }
            />
            <Area dataKey="denied" type="natural" fill="url(#fillDenied)" stroke="var(--color-denied)" stackId="a" />
            <Area dataKey="granted" type="natural" fill="url(#fillGranted)" stroke="var(--color-granted)" stackId="a" />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
