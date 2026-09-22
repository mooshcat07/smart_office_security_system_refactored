import { query } from "../_generated/server";

export const getDevices = query({
  handler: async (ctx) => {
    return await ctx.db.query("devices").collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("devices").order("desc").collect();
  },
});
