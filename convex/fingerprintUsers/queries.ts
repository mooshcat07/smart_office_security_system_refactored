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