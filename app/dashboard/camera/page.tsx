"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CameraIcon,
  CameraOffIcon,
  CircleIcon,
  Maximize2Icon,
  Minimize2Icon,
  RefreshCwIcon,
  Volume2Icon,
  VolumeXIcon,
  WifiIcon,
  WifiOffIcon,
  ExternalLinkIcon,
  ShieldIcon,
  ClockIcon,
} from "lucide-react";

// IP Webcam server running on the phone (same Wi-Fi as this computer)
const CAMERA_URL = "https://10.181.201.215:8080";

export default function CameraPage() {
  const [status, setStatus] = useState<"connecting" | "live" | "error">(
    "connecting"
  );
  // Changing this key forces the <img> to reconnect to the stream
  const [attempt, setAttempt] = useState(0);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const reconnect = () => {
    setStatus("connecting");
    setAttempt((n) => n + 1);
  };

  const isLive = status === "live";
  const isError = status === "error";
  const isConnecting = status === "connecting";

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      {/* Ops header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Live Surveillance
            </h1>
            <p className="text-xs text-muted-foreground">
              Security camera monitoring · Entrance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 font-medium",
              isLive && "border-emerald-300 text-emerald-700 bg-emerald-50",
              isError && "border-red-300 text-red-700 bg-red-50",
              isConnecting && "border-amber-300 text-amber-700 bg-amber-50"
            )}
          >
            {isLive ? (
              <WifiIcon className="size-3" />
            ) : (
              <WifiOffIcon className="size-3" />
            )}
            {isLive ? "Online" : isConnecting ? "Connecting…" : "Offline"}
          </Badge>

          {isLive && (
            <Badge
              variant="outline"
              className="gap-1.5 border-red-300 bg-red-50 font-medium text-red-700"
            >
              <CircleIcon className="size-2 fill-red-600 text-red-600 animate-pulse" />
              REC
            </Badge>
          )}

          <Badge variant="outline" className="gap-1.5 font-normal tabular-nums">
            <ClockIcon className="size-3" />
            {now.toLocaleTimeString("en-GB", { hour12: false })}
          </Badge>
        </div>
      </div>

      {/* Main surveillance viewport */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-zinc-950 shadow-xl",
          fullscreen && "fixed inset-4 z-50 rounded-xl"
        )}
      >
        {/* Top chrome bar */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-sm">
              CAM-01 · ENTRANCE
            </span>
            {isLive && (
              <span className="flex items-center gap-1.5 rounded bg-red-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                <CircleIcon className="size-2 fill-white animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline rounded bg-black/40 px-2 py-0.5 font-mono text-[10px] text-white/60 backdrop-blur-sm">
              {CAMERA_URL ?? "No camera URL configured"}
            </span>
          </div>
        </div>

        {/* Video area */}
        <div className="relative aspect-video w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={attempt}
            src={CAMERA_URL ? `${CAMERA_URL}/video` : undefined}
            alt="Live camera feed"
            className="h-full w-full object-contain"
            onLoad={() => setStatus("live")}
            onError={() => setStatus("error")}
          />

          {/* Connecting overlay */}
          {isConnecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <div className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
              <p className="text-sm font-medium tracking-wide text-white/80">
                Establishing secure link…
              </p>
            </div>
          )}

          {/* Error / no signal overlay */}
          {isError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                <CameraOffIcon className="size-8 text-zinc-500" />
              </div>
              <div>
                <p className="text-base font-semibold tracking-wide text-white">
                  NO SIGNAL
                </p>
                <p className="mt-1 max-w-sm text-sm text-zinc-400">
                  Can&apos;t reach the camera. Check that IP Webcam is running
                  (&quot;Start server&quot;) and that the phone and this computer
                  are on the same Wi-Fi.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                className="mt-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <RefreshCwIcon className="mr-2 size-3.5" />
                Retry connection
              </Button>
            </div>
          )}

          {/* Scanlines for security aesthetic */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)",
            }}
          />

          {/* Bottom HUD */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-10">
            <div className="space-y-1">
              <p className="font-mono text-[11px] text-white/70">
                {now.toLocaleString("en-GB", {
                  hour12: false,
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
              <p className="text-xs font-medium text-white/90">
                Entrance Camera · Ground Floor
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-white hover:bg-white/15 hover:text-white"
                onClick={() => setMuted((m) => !m)}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeXIcon className="size-4" />
                ) : (
                  <Volume2Icon className="size-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-white hover:bg-white/15 hover:text-white"
                onClick={() => setFullscreen((f) => !f)}
                title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {fullscreen ? (
                  <Minimize2Icon className="size-4" />
                ) : (
                  <Maximize2Icon className="size-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-white hover:bg-white/15 hover:text-white"
                onClick={reconnect}
                title="Reconnect"
              >
                <RefreshCwIcon className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Control strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-lg",
                isLive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isLive ? (
                <CameraIcon className="size-4" />
              ) : (
                <CameraOffIcon className="size-4" />
              )}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Feed status</p>
              <p className="text-sm font-semibold capitalize">{status}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <CircleIcon className="size-3 fill-current" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Recording</p>
              <p className="text-sm font-semibold">
                {isLive ? "Active" : "Standby"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <WifiIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Source</p>
              <p className="truncate text-sm font-semibold">IP Webcam</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[11px] text-muted-foreground">Actions</p>
              <p className="text-sm font-semibold">Controls</p>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={reconnect}>
                <RefreshCwIcon className="size-3.5" />
              </Button>
              {CAMERA_URL && (
                <a
                  href={CAMERA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                  })}
                >
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}