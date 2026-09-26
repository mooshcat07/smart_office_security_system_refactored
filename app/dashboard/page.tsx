"use client"
import { useQuery } from "convex/react"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable, type AccessLog } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import { api } from "../../convex/_generated/api"
import { useEffect, useState } from "react"

export default function Page() {
  const [online, setonline] = useState(false);
  const stats = useQuery(api.dashboard.queries.getDashboardStats);

  const recentLogs = useQuery(
    api.dashboard.queries.getRecentAccessLogs
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards stats={stats} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <DataTable
            data={(recentLogs ?? []) as AccessLog[]}
          />
        </div>
      </div>
    </div>
  )
}
