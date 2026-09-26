"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShieldCheckIcon,
  ShieldXIcon,
  ActivityIcon,
  WifiIcon,
} from "lucide-react";
import { useEffect } from "react";

type DashboardStats = {
  totalAccessToday: number;
  grantedToday: number;
  deniedToday: number;
  activeAlarms: number;
  registeredFingerprints: number;
  onlineDevices: number;
  totalDevices: number;
};

export function SectionCards({ stats }: { stats?: DashboardStats }) {
  const allDevicesOnline =
    stats &&
    stats.totalDevices > 0 &&
    stats.onlineDevices === stats.totalDevices;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {/* Total Access Events */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Access Events</CardDescription>

          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.totalAccessToday ?? "—"}
          </CardTitle>

          <CardAction>
            <Badge variant="outline">
              <ShieldCheckIcon className="size-3" />
              Today
            </Badge>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <ShieldCheckIcon className="size-4 text-green-500" />

            {stats
              ? `${stats.grantedToday} granted · ${stats.deniedToday} denied`
              : "Loading access data..."}
          </div>

          <div className="text-muted-foreground">Across all devices today</div>
        </CardFooter>
      </Card>

      {/* Denied Access */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Denied Access Attempts</CardDescription>

          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.deniedToday ?? "—"}
          </CardTitle>

          <CardAction>
            <Badge
              variant="outline"
              className="text-destructive border-destructive/30"
            >
              <ShieldXIcon className="size-3" />
              Today
            </Badge>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <ShieldXIcon className="size-4 text-red-500" />

            {stats?.deniedToday ? "Needs attention" : "No denied attempts"}
          </div>

          <div className="text-muted-foreground">
            Unrecognised fingerprints blocked
          </div>
        </CardFooter>
      </Card>

      {/* Active Alarms */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Alarms</CardDescription>

          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.activeAlarms ?? "—"}
          </CardTitle>

          <CardAction>
            <Badge
              variant="outline"
              className={
                stats?.activeAlarms
                  ? "text-orange-500 border-orange-300"
                  : "text-green-600 border-green-300"
              }
            >
              <ActivityIcon className="size-3" />

              {stats?.activeAlarms ? "Unresolved" : "All clear"}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <ActivityIcon
              className={`size-4 ${
                stats?.activeAlarms ? "text-orange-500" : "text-green-500"
              }`}
            />

            {stats?.activeAlarms
              ? `${stats.activeAlarms} alarm${
                  stats.activeAlarms === 1 ? "" : "s"
                } currently active`
              : "No active alarms"}
          </div>

          <div className="text-muted-foreground">
            Motion and security alerts
          </div>
        </CardFooter>
      </Card>

      {/* Devices Online */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Devices Online</CardDescription>

          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats ? `${stats.onlineDevices} / ${stats.totalDevices}` : "—"}
          </CardTitle>

          <CardAction>
            <Badge
              variant="outline"
              className={
                allDevicesOnline
                  ? "text-green-600 border-green-300"
                  : "text-orange-500 border-orange-300"
              }
            >
              <WifiIcon className="size-3" />

              {allDevicesOnline ? "All online" : "Check devices"}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <WifiIcon
              className={`size-4 ${
                allDevicesOnline ? "text-green-500" : "text-orange-500"
              }`}
            />

            {stats
              ? `${stats.onlineDevices} of ${stats.totalDevices} ESP32 ${
                  stats.totalDevices === 1 ? "device" : "devices"
                } connected`
              : "Loading device status..."}
          </div>

          <div className="text-muted-foreground">IoT security devices</div>
        </CardFooter>
      </Card>
    </div>
  );
}
