import { httpRouter } from "convex/server"
import { httpAction } from "./_generated/server"
import { internal } from "./_generated/api"

const http = httpRouter()

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

/**
 * Every ESP32 request must send this header. Set ESP32_API_KEY in the
 * Convex deployment's environment variables (`npx convex env set ESP32_API_KEY ...`)
 * and flash the same value into the device sketch.
 */
function checkApiKey(req: Request): Response | null {
  const expected = process.env.ESP32_API_KEY
  if (!expected) {
    // Fail closed: if no key is configured, refuse rather than accept anything.
    return json({ error: "Server misconfigured: ESP32_API_KEY not set" }, 500)
  }
  const provided = req.headers.get("x-api-key")
  if (provided !== expected) {
    return json({ error: "Unauthorized" }, 401)
  }
  return null
}

// ─── POST /esp32/register ───────────────────────────────────────────────────
// Called once when a device boots for the first time (or after a re-flash).
http.route({
  path: "/esp32/register",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const authError = checkApiKey(req)
    if (authError) return authError

    const body: unknown = await req.json().catch(() => null)
    if (typeof body !== "object" || body === null) {
      return json({ error: "Invalid JSON body" }, 400)
    }
    const { esp32Id, name, location, firmware } = body as Record<string, unknown>

    if (typeof esp32Id !== "string" || esp32Id.length === 0) {
      return json({ error: "esp32Id (string) is required" }, 400)
    }
    if (typeof name !== "string" || name.length === 0) {
      return json({ error: "name (string) is required" }, 400)
    }
    if (typeof location !== "string" || location.length === 0) {
      return json({ error: "location (string) is required" }, 400)
    }
    if (firmware !== undefined && typeof firmware !== "string") {
      return json({ error: "firmware must be a string if provided" }, 400)
    }

    const deviceId = await ctx.runMutation(internal.devices.register, {
      esp32Id,
      name,
      location,
      firmware,
    })

    return json({ ok: true, deviceId })
  }),
})

// ─── POST /esp32/heartbeat ───────────────────────────────────────────────────
// Called periodically (e.g. every 30s) so the dashboard knows the device is alive.
http.route({
  path: "/esp32/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const authError = checkApiKey(req)
    if (authError) return authError

    const body: unknown = await req.json().catch(() => null)
    if (typeof body !== "object" || body === null) {
      return json({ error: "Invalid JSON body" }, 400)
    }
    const { esp32Id, firmware } = body as Record<string, unknown>

    if (typeof esp32Id !== "string" || esp32Id.length === 0) {
      return json({ error: "esp32Id (string) is required" }, 400)
    }
    if (firmware !== undefined && typeof firmware !== "string") {
      return json({ error: "firmware must be a string if provided" }, 400)
    }

    const deviceId = await ctx.runMutation(internal.devices.heartbeat, {
      esp32Id,
      firmware,
    })

    return json({ ok: true, deviceId })
  }),
})

// ─── POST /esp32/access-log ──────────────────────────────────────────────────
// Called every time the fingerprint sensor scans (successfully or not).
http.route({
  path: "/esp32/access-log",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const authError = checkApiKey(req)
    if (authError) return authError

    const body: unknown = await req.json().catch(() => null)
    if (typeof body !== "object" || body === null) {
      return json({ error: "Invalid JSON body" }, 400)
    }
    const { esp32Id, fingerprintId, status } = body as Record<string, unknown>

    if (typeof esp32Id !== "string" || esp32Id.length === 0) {
      return json({ error: "esp32Id (string) is required" }, 400)
    }
    if (status !== "GRANTED" && status !== "DENIED") {
      return json({ error: 'status must be "GRANTED" or "DENIED"' }, 400)
    }
    if (fingerprintId !== undefined && typeof fingerprintId !== "number") {
      return json({ error: "fingerprintId must be a number if provided" }, 400)
    }

    const device = await ctx.runQuery(internal.devices.getByEsp32Id, { esp32Id })
    if (!device) {
      return json({ error: `Unknown device: ${esp32Id}. Register it first.` }, 404)
    }

    const result = await ctx.runMutation(internal.accessLogs.record, {
      deviceId: device._id,
      esp32Id,
      fingerprintId,
      status,
    })

    return json({ ok: true, ...result })
  }),
})

// ─── POST /esp32/motion-event ────────────────────────────────────────────────
// Called every time the PIR sensor trips.
http.route({
  path: "/esp32/motion-event",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const authError = checkApiKey(req)
    if (authError) return authError

    const body: unknown = await req.json().catch(() => null)
    if (typeof body !== "object" || body === null) {
      return json({ error: "Invalid JSON body" }, 400)
    }
    const { esp32Id } = body as Record<string, unknown>

    if (typeof esp32Id !== "string" || esp32Id.length === 0) {
      return json({ error: "esp32Id (string) is required" }, 400)
    }

    const device = await ctx.runQuery(internal.devices.getByEsp32Id, { esp32Id })
    if (!device) {
      return json({ error: `Unknown device: ${esp32Id}. Register it first.` }, 404)
    }

    const result = await ctx.runMutation(internal.motionsevents.record, {
      deviceId: device._id,
      esp32Id,
    })

    return json({ ok: true, ...result })
  }),
})

// ─── POST /esp32/commands ───────────────────────────────────────────────────────
// ESP32 polls for pending commands every few seconds.
http.route({
  path: "/esp32/commands",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const authError = checkApiKey(req)
    if (authError) return authError

    const body: unknown = await req.json().catch(() => null)
    if (typeof body !== "object" || body === null) {
      return json({ error: "Invalid JSON body" }, 400)
    }
    const { esp32Id } = body as Record<string, unknown>

    if (typeof esp32Id !== "string" || esp32Id.length === 0) {
      return json({ error: "esp32Id (string) is required" }, 400)
    }

    const device = await ctx.runQuery(internal.devices.getByEsp32Id, { esp32Id })
    if (!device) {
      return json({ error: `Unknown device: ${esp32Id}. Register it first.` }, 404)
    }

    const commands = await ctx.runQuery(internal.deviceCommands.getPendingForDevice, {
      esp32Id,
    })

    return json({ ok: true, commands })
  }),
})

// ─── POST /esp32/command-ack ────────────────────────────────────────────────────
// ESP32 acknowledges that it received and executed a command.
http.route({
  path: "/esp32/command-ack",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const authError = checkApiKey(req)
    if (authError) return authError

    const body: unknown = await req.json().catch(() => null)
    if (typeof body !== "object" || body === null) {
      return json({ error: "Invalid JSON body" }, 400)
    }
    const { esp32Id, commandId, success, errorReason } = body as Record<string, unknown>

    if (typeof esp32Id !== "string" || esp32Id.length === 0) {
      return json({ error: "esp32Id (string) is required" }, 400)
    }
    if (typeof commandId !== "string" || commandId.length === 0) {
      return json({ error: "commandId (string) is required" }, 400)
    }
    if (typeof success !== "boolean") {
      return json({ error: "success (boolean) is required" }, 400)
    }

    const device = await ctx.runQuery(internal.devices.getByEsp32Id, { esp32Id })
    if (!device) {
      return json({ error: `Unknown device: ${esp32Id}. Register it first.` }, 404)
    }

    if (success) {
      await ctx.runMutation(internal.deviceCommands.acknowledge, {
        commandId: commandId as any,
      })
      return json({ ok: true })
    } else {
      const reason = typeof errorReason === "string" ? errorReason : "Unknown error"
      await ctx.runMutation(internal.deviceCommands.markFailed, {
        commandId: commandId as any,
        reason,
      })
      return json({ ok: true })
    }
  }),
})

export default http