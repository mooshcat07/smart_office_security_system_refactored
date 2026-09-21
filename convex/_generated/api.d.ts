/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as Crons from "../Crons.js";
import type * as Http from "../Http.js";
import type * as accessLogs from "../accessLogs.js";
import type * as alarmEvents from "../alarmEvents.js";
import type * as deviceCommands from "../deviceCommands.js";
import type * as devices from "../devices.js";
import type * as fingerprintUsers from "../fingerprintUsers.js";
import type * as motionsevents from "../motionsevents.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  Crons: typeof Crons;
  Http: typeof Http;
  accessLogs: typeof accessLogs;
  alarmEvents: typeof alarmEvents;
  deviceCommands: typeof deviceCommands;
  devices: typeof devices;
  fingerprintUsers: typeof fingerprintUsers;
  motionsevents: typeof motionsevents;
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
