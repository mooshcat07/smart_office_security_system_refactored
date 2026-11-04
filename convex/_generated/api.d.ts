/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accessLogs_mutations from "../accessLogs/mutations.js";
import type * as accessLogs_queries from "../accessLogs/queries.js";
import type * as alarmEvents_mutations from "../alarmEvents/mutations.js";
import type * as alarmEvents_queries from "../alarmEvents/queries.js";
import type * as dashboard_queries from "../dashboard/queries.js";
import type * as deviceCommands_mutations from "../deviceCommands/mutations.js";
import type * as deviceCommands_queries from "../deviceCommands/queries.js";
import type * as devices_mutation from "../devices/mutation.js";
import type * as devices_queries from "../devices/queries.js";
import type * as fingerprintUsers_mutation from "../fingerprintUsers/mutation.js";
import type * as fingerprintUsers_queries from "../fingerprintUsers/queries.js";
import type * as motionEvents_mutations from "../motionEvents/mutations.js";
import type * as motionEvents_queries from "../motionEvents/queries.js";
import type * as settings_helpers from "../settings/helpers.js";
import type * as settings_mutations from "../settings/mutations.js";
import type * as settings_queries from "../settings/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "accessLogs/mutations": typeof accessLogs_mutations;
  "accessLogs/queries": typeof accessLogs_queries;
  "alarmEvents/mutations": typeof alarmEvents_mutations;
  "alarmEvents/queries": typeof alarmEvents_queries;
  "dashboard/queries": typeof dashboard_queries;
  "deviceCommands/mutations": typeof deviceCommands_mutations;
  "deviceCommands/queries": typeof deviceCommands_queries;
  "devices/mutation": typeof devices_mutation;
  "devices/queries": typeof devices_queries;
  "fingerprintUsers/mutation": typeof fingerprintUsers_mutation;
  "fingerprintUsers/queries": typeof fingerprintUsers_queries;
  "motionEvents/mutations": typeof motionEvents_mutations;
  "motionEvents/queries": typeof motionEvents_queries;
  "settings/helpers": typeof settings_helpers;
  "settings/mutations": typeof settings_mutations;
  "settings/queries": typeof settings_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
