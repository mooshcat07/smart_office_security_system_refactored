"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Volume2, VolumeX, Loader2 } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"

export function BuzzerControl({ deviceId }: { deviceId: Id<"devices"> }) {
  const [isTriggering, setIsTriggering] = useState(false)
  const [isSilencing, setIsSilencing] = useState(false)

  const triggerBuzzer = useMutation(api.deviceCommands.triggerBuzzer)
  const silenceBuzzer = useMutation(api.deviceCommands.silenceBuzzer)
  const recentCommands = useQuery(api.deviceCommands.listByDevice, { deviceId })

  const handleTriggerBuzzer = async () => {
    setIsTriggering(true)
    try {
      await triggerBuzzer({ deviceId, durationMs: 2000 })
    } finally {
      setIsTriggering(false)
    }
  }

  const handleSilenceBuzzer = async () => {
    setIsSilencing(true)
    try {
      await silenceBuzzer({ deviceId })
    } finally {
      setIsSilencing(false)
    }
  }

  const pendingCommands = recentCommands?.filter((cmd) => cmd.status === "PENDING") || []
  const lastCommand = recentCommands?.[0]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Buzzer Control</CardTitle>
          </div>
          {pendingCommands.length > 0 && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              {pendingCommands.length} pending
            </Badge>
          )}
        </div>
        <CardDescription>Trigger or silence the alarm buzzer on this device</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleTriggerBuzzer}
            disabled={isTriggering || isSilencing}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {isTriggering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Triggering...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Trigger Buzzer
              </>
            )}
          </Button>
          <Button
            onClick={handleSilenceBuzzer}
            disabled={isTriggering || isSilencing}
            variant="outline"
            className="flex-1"
          >
            {isSilencing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Silencing...
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-2" />
                Silence
              </>
            )}
          </Button>
        </div>

        {lastCommand && (
          <div className="text-sm border-t pt-3">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Last command:</span>
              <Badge
                variant={
                  lastCommand.status === "ACKNOWLEDGED"
                    ? "default"
                    : lastCommand.status === "PENDING"
                      ? "outline"
                      : "destructive"
                }
              >
                {lastCommand.status}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {lastCommand.command === "TRIGGER_BUZZER" ? "Trigger" : "Silence"} •{" "}
              {new Date(lastCommand.createdAt).toLocaleTimeString()}
            </div>
            {lastCommand.failureReason && (
              <div className="text-red-600 text-xs mt-1">Error: {lastCommand.failureReason}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}