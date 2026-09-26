import { query } from "../_generated/server";

export const getAllAccessLogs = query({
  args: {},

  handler: async (ctx) => {
    const logs = await ctx.db
      .query("accessLogs")
      .order("desc")
      .collect();

    const result = [];

    for (const log of logs) {
      const device = await ctx.db.get(log.deviceId);

      result.push({
        id: log._id,
        employeeName: log.employeeName ?? "Unknown",
        employeeNumber: log.employeeNumber ?? null,
        device: device?.name ?? log.esp32Id,
        location: device?.location ?? "Unknown",
        status: log.status,
        timestamp: new Date(log._creationTime).toISOString(),
      });
    }

    return result;
  },
});