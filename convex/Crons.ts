import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

// If a device hasn't sent a heartbeat/scan/motion-event in a while, flip it
// to OFFLINE so the Devices dashboard page stays accurate even if an ESP32
// loses power or WiFi without sending a graceful disconnect.
crons.interval("sweep stale devices", { minutes: 1 }, internal.devices.sweepStaleDevices, {})

export default crons