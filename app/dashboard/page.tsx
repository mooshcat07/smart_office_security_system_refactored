"use client"

import { useQuery } from "convex/react"
import { useEffect, useRef } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable, type AccessLog } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { api } from "../../convex/_generated/api"
import { toast } from "sonner"

export default function Page() {
  const stats = useQuery(api.dashboard.queries.getDashboardStats)
  const recentLogs = useQuery(api.dashboard.queries.getRecentAccessLogs)

  // Track previous device online count to detect changes
  const prevOnlineRef = useRef<number | null>(null)
  const prevAlarmsRef = useRef<number | null>(null)

  useEffect(() => {
    if (!stats) return

    // Heartbeat check — notify when a device goes offline or comes back
    if (prevOnlineRef.current !== null && prevOnlineRef.current !== stats.onlineDevices) {
      if (stats.onlineDevices < prevOnlineRef.current) {
        toast.warning(
          `⚠️ Device went offline — ${stats.onlineDevices}/${stats.totalDevices} devices online`
        )
      } else {
        toast.success(
          `✅ Device back online — ${stats.onlineDevices}/${stats.totalDevices} devices online`
        )
      }
    }
    prevOnlineRef.current = stats.onlineDevices

    // Alarm check — notify when new active alarm appears
    if (prevAlarmsRef.current !== null && stats.activeAlarms > prevAlarmsRef.current) {
      toast.error(`🚨 New alarm triggered — ${stats.activeAlarms} active alarm(s)`)
    }
    prevAlarmsRef.current = stats.activeAlarms
  }, [stats?.onlineDevices, stats?.activeAlarms])

  useEffect(() => {
    setTimeout(() => {
      // Frontend checking after 30 seconds if the backend is still alive, if not, show a toast notification
    }, 3000);
  },[])

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards stats={stats} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable data={(recentLogs ?? []) as AccessLog[]} />
        </div>
      </div>
    </div>
  )
}
