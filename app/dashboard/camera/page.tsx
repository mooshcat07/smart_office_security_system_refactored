"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CameraIcon, CameraOffIcon, RefreshCwIcon } from "lucide-react";

// IP Webcam server running on the phone (same Wi-Fi as this computer)
const CAMERA_URL =
  process.env.NEXT_PUBLIC_CAMERA_URL;

export default function CameraPage() {
  const [status, setStatus] = useState<"connecting" | "live" | "error">(
    "connecting"
  );
  // Changing this key forces the <img> to reconnect to the stream
  const [attempt, setAttempt] = useState(0);

  const reconnect = () => {
    setStatus("connecting");
    setAttempt((n) => n + 1);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Camera</h1>
        <p className="text-muted-foreground">
          Live feed from the phone camera (IP Webcam)
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Entrance Camera</CardTitle>
              <CardDescription>{CAMERA_URL}</CardDescription>
            </div>
            <Badge variant={status === "live" ? "default" : "secondary"}>
              {status === "live" ? (
                <CameraIcon className="h-3 w-3 mr-1" />
              ) : (
                <CameraOffIcon className="h-3 w-3 mr-1" />
              )}
              {status === "live"
                ? "LIVE"
                : status === "connecting"
                ? "CONNECTING"
                : "OFFLINE"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={attempt}
              src={`${CAMERA_URL}/video`}
              alt="Live camera feed"
              className="h-full w-full object-contain"
              onLoad={() => setStatus("live")}
              onError={() => setStatus("error")}
            />
            {status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4 text-center text-sm text-white">
                <p className="font-medium">Can&apos;t reach the camera</p>
                <p className="text-white/70">
                  Check that IP Webcam is running (&quot;Start server&quot;) and
                  that the phone and this computer are on the same Wi-Fi.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={reconnect}>
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
            <a
              href={CAMERA_URL}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              Open in IP Webcam
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}