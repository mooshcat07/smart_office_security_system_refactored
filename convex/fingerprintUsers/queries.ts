import { query } from "../_generated/server";

export const getNextFingerprintId = query({
  args: {},

  handler: async (ctx) => {
    const users = await ctx.db
      .query("fingerprintUsers")
      .collect();

    const usedIds = new Set(
      users.map((user) => user.fingerprintId)
    );

    // AS608 supports IDs 1–127
    for (let id = 1; id <= 127; id++) {
      if (!usedIds.has(id)) {
        return {
          fingerprintId: id,
        };
      }
    }

    throw new Error(
      "No fingerprint ID is available. The sensor supports 127 fingerprints."
    );
  },
});

export const getRegisteredUsers = query({
  args: {},

  handler: async (ctx) => {
    const users = await ctx.db
      .query("fingerprintUsers")
      .collect();

    const accessLogs = await ctx.db
      .query("accessLogs")
      .order("desc")
      .collect();

    return users.map((user) => {
      const lastAccess = accessLogs.find(
        (log) =>
          log.status === "GRANTED" &&
          log.fingerprintId === user.fingerprintId
      );

      return {
        id: user._id,
        fingerprintId: user.fingerprintId,
        name: user.fullName,
        employeeNumber: user.employeeNumber,

        role: (user.role ?? "STAFF") as
          | "ADMIN"
          | "STAFF"
          | "SECURITY",

        department: user.department ?? "Not assigned",
        // Raw value (undefined when unset) for edit forms, so we
        // don't accidentally save the literal "Not assigned" text.
        rawDepartment: user.department ?? "",

        status: user.active
          ? ("ACTIVE" as const)
          : ("INACTIVE" as const),

        fingerprintRegistered: true,

        registeredAt: new Date(
          user._creationTime
        ).toISOString(),

        lastAccess: lastAccess
          ? new Date(
              lastAccess._creationTime
            ).toISOString()
          : null,
      };
    });
  },
});