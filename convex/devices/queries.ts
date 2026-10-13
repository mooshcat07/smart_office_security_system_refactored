import { query } from "../_generated/server";

export const getDevices = query({
  handler: async (ctx) => {
    return await ctx.db.query("devices").collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Online/offline is NOT computed here: a Convex query only re-runs when
    // data changes, so a device that stops sending heartbeats would stay
    // "online" forever. Use the useDevicePresence() hook in the browser,
    // which re-checks lastSeen every 10 seconds.
    return await ctx.db.query("devices").order("desc").collect();
  },
});