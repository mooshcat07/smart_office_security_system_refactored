"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "@/components/ui/toast";

// ESP32 sends a heartbeat every 30s, so 60s = 2 missed heartbeats.
export const HEARTBEAT_TIMEOUT_MS = 60_000;
// How often the browser re-checks the heartbeat.
export const PRESENCE_CHECK_MS = 10_000;

/** Returns Date.now(), refreshed on an interval (and when the tab becomes visible again). */
export function useNow(intervalMs: number = PRESENCE_CHECK_MS) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, intervalMs);

    // Background tabs throttle timers, so refresh immediately when the user returns.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);

  return now;
}

/** 90_000 -> "1m", 3_900_000 -> "1h 5m", 190_000_000 -> "2d 4h" */
export function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
}

/**
 * Live device list with online/offline computed in the browser.
 *
 * Why this is needed: Convex only re-sends a query when its data changes.
 * When a device stops sending heartbeats nothing in the database changes,
 * so a server-side `Date.now() - lastSeen` check is never re-run and the
 * UI stays "online" forever. Here the clock ticks locally instead.
 */
export function useDevicePresence({ notify = false }: { notify?: boolean } = {}) {
  const devices = useQuery(api.devices.queries.list);
  const now = useNow();

  const list = useMemo(
    () =>
      devices?.map((device) => {
        const sinceLastSeen = Math.max(0, now - device.lastSeen);
        const isOnline = sinceLastSeen < HEARTBEAT_TIMEOUT_MS;
        return {
          ...device,
          isOnline,
          // How long the device has been silent (only meaningful when offline)
          offlineFor: isOnline ? null : formatDuration(sinceLastSeen),
        };
      }),
    [devices, now]
  );

  // Toast when a device changes state (never on first load)
  const prevRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!list || !notify) return;

    list.forEach((device) => {
      const prev = prevRef.current[device._id];
      if (prev !== undefined && prev !== device.isOnline) {
        toast.add({
          type: device.isOnline ? "success" : "warning",
          title: device.isOnline ? "Device back online" : "Device went offline",
          description: device.isOnline
            ? `${device.name} is sending heartbeats again.`
            : `${device.name} missed its heartbeat.`,
        });
      }
      prevRef.current[device._id] = device.isOnline;
    });
  }, [list, notify]);

  const onlineCount = list?.filter((d) => d.isOnline).length ?? 0;

  return { devices: list, onlineCount, totalCount: list?.length ?? 0 };
}