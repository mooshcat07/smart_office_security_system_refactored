"use client";

import { useDevicePresence } from "@/hooks/use-device-presence";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WifiIcon, WifiOff } from "lucide-react";
import { BuzzerControl } from "@/components/buzzer-control";

export default function DevicesPage() {
  // Re-checks the heartbeat every 10s and toasts on online/offline changes
  const { devices } = useDevicePresence({ notify: true });

  if (!devices) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading devices...</p>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-2">
        <p className="text-muted-foreground">No devices registered yet</p>
        <p className="text-sm text-muted-foreground">
          Register an ESP32 by sending a POST to /esp32/register
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground">
            Manage and monitor your ESP32 security devices
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => {
          const { isOnline } = device;

          return (
            <Card key={device._id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{device.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {device.location}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={isOnline ? "default" : "secondary"}
                    className="ml-2 shrink-0"
                  >
                    {isOnline ? (
                      <WifiIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <WifiOff className="h-3 w-3 mr-1" />
                    )}
                    {isOnline ? "ONLINE" : "OFFLINE"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {device.esp32Id}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Seen:</span>
                    <span className={!isOnline ? "text-red-500" : ""}>
                      {new Date(device.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                  {!isOnline && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Offline for:</span>
                      <span className="text-red-500 font-medium">
                        {device.offlineFor}
                      </span>
                    </div>
                  )}
                  {device.firmware && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Firmware:</span>
                      <span className="text-xs">{device.firmware}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <BuzzerControl deviceId={device._id} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}