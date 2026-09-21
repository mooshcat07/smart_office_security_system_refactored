import { query } from "../_generated/server";

export const getDevices = query({
  handler: async (ctx) => {
    return await ctx.db.query("devices").collect();
  },
});