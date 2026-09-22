import { query } from "../_generated/server";

export const getDevices = query({
  handler: async (ctx) => {
    return await ctx.db.query("devices").collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("devices").order("desc").collect();
    return devices.map((device) => ({
      ...device,
      // Device is online if a heartbeat
      // was received within the last 60 seconds.
      isOnline: Date.now() - device.lastSeen < 60_000,
    }));
  },
});
