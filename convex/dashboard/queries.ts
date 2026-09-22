import { v } from "convex/values";
import { query } from "../_generated/server";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    ).getTime();

    // ----------------------------------------
    // ACCESS LOGS
    // ----------------------------------------

    const logs = await ctx.db.query("accessLogs").collect();

    const todayLogs = logs.filter(
      (log) =>
        log._creationTime >= startOfToday && log._creationTime < endOfToday,
    );

    const grantedToday = todayLogs.filter(
      (log) => log.status === "GRANTED",
    ).length;

    const deniedToday = todayLogs.filter(
      (log) => log.status === "DENIED",
    ).length;

    // ----------------------------------------
    // DEVICES
    // ----------------------------------------

    const devices = await ctx.db.query("devices").collect();

    const onlineDevices = devices.filter(
      (device) => Date.now() - device.lastSeen < 60_000,
    ).length;

    const totalDevices = devices.length;

    // ----------------------------------------
    // FINGERPRINT USERS
    // ----------------------------------------

    const fingerprintUsers = await ctx.db.query("fingerprintUsers").collect();

    const registeredFingerprints = fingerprintUsers.filter(
      (user) => user.active,
    ).length;

    // ----------------------------------------
    // ACTIVE ALARMS
    // ----------------------------------------

    const activeAlarms = await ctx.db
      .query("alarmEvents")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .collect();

    return {
      totalAccessToday: todayLogs.length,
      grantedToday,
      deniedToday,
      activeAlarms: activeAlarms.length,
      registeredFingerprints,
      onlineDevices,
      totalDevices,
    };
  },
});

export const getRecentAccessLogs = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("accessLogs").order("desc").take(100);
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

export const getAccessChartData = query({
  args: {
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - args.days + 1,
    );
    startDate.setHours(0, 0, 0, 0);
    const startTimestamp = startDate.getTime();
    const logs = await ctx.db
      .query("accessLogs")
      .filter((q) => q.gte(q.field("_creationTime"), startTimestamp))
      .collect();
    const data = [];
    for (let i = 0; i < args.days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ).getTime();
      const dateEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1,
      ).getTime();
      const dayLogs = logs.filter(
        (log) => log._creationTime >= dateStart && log._creationTime < dateEnd,
      );

      data.push({
        date: date.toISOString().split("T")[0],
        granted: dayLogs.filter((log) => log.status === "GRANTED").length,
        denied: dayLogs.filter((log) => log.status === "DENIED").length,
      });
    }

    return data;
  },
});
