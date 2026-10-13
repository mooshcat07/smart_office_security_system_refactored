"use client"

import { useQuery } from "convex/react"
import { useEffect, useRef } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable, type AccessLog } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { api } from "../../convex/_generated/api"
import { toast } from "@/components/ui/toast"
import { useDevicePresence } from "@/hooks/use-device-presence"

export default function Page() {
  const stats = useQuery(api.dashboard.queries.getDashboardStats)
  const recentLogs = useQuery(api.dashboard.queries.getRecentAccessLogs)

  // Re-checks the heartbeat every 10s and toasts on online/offline changes
  const { devices, onlineCount, totalCount } = useDevicePresence({ notify: true })

  const prevAlarmsRef = useRef<number | null>(null)

  useEffect(() => {
    if (!stats) return

    // Alarm check — notify when new active alarm appears
    if (prevAlarmsRef.current !== null && stats.activeAlarms > prevAlarmsRef.current) {
      toast.add({
        type: "error",
        title: "New alarm triggered",
        description: `${stats.activeAlarms} active alarm(s)`,
      })
    }
    prevAlarmsRef.current = stats.activeAlarms
  }, [stats?.activeAlarms])

  // Replace the server's (stale-prone) device counts with the live ones
  const liveStats = stats
    ? { ...stats, onlineDevices: onlineCount, totalDevices: totalCount }
    : undefined

  const offlineDevices = (devices ?? [])
    .filter((d) => !d.isOnline)
    .map((d) => ({ name: d.name, offlineFor: d.offlineFor ?? "" }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards stats={liveStats} offlineDevices={offlineDevices} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={(recentLogs ?? []) as AccessLog[]} />
        </div>
      </div>
    </div>
  )
}