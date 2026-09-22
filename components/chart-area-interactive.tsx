"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useQuery } from "convex/react"

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

import { api } from "../convex/_generated/api"

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

  const days =
    timeRange === "7d"
      ? 7
      : timeRange === "30d"
        ? 30
        : 90

  const chartData = useQuery(
    api.dashboard.queries.getAccessChartData,
    { days }
  )

  const [prevIsMobile, setPrevIsMobile] =
    React.useState(isMobile)

  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile)

    if (isMobile) {
      setTimeRange("7d")
    }
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Access Events Over Time</CardTitle>

        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Granted vs denied fingerprint scans
          </span>

          <span className="@[540px]/card:hidden">
            Granted vs denied
          </span>
        </CardDescription>

        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) =>
              setTimeRange(value[0] ?? "90d")
            }
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">
              Last 3 months
            </ToggleGroupItem>

            <ToggleGroupItem value="30d">
              Last 30 days
            </ToggleGroupItem>

            <ToggleGroupItem value="7d">
              Last 7 days
            </ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value) setTimeRange(value)
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>

            <SelectContent className="rounded-xl">
              <SelectItem
                value="90d"
                className="rounded-lg"
              >
                Last 3 months
              </SelectItem>

              <SelectItem
                value="30d"
                className="rounded-lg"
              >
                Last 30 days
              </SelectItem>

              <SelectItem
                value="7d"
                className="rounded-lg"
              >
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {!chartData ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Loading access data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No access events yet.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="fillGranted"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-granted)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-granted)"
                    stopOpacity={0.1}
                  />
                </linearGradient>

                <linearGradient
                  id="fillDenied"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="var(--color-denied)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-denied)"
                    stopOpacity={0.1}
                  />
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
                  new Date(value).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                    }
                  )
                }
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(
                        value as string
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )
                    }
                    indicator="dot"
                  />
                }
              />

              <Area
                dataKey="denied"
                type="natural"
                fill="url(#fillDenied)"
                stroke="var(--color-denied)"
                stackId="a"
              />

              <Area
                dataKey="granted"
                type="natural"
                fill="url(#fillGranted)"
                stroke="var(--color-granted)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
