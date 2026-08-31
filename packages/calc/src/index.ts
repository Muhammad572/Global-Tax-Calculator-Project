/**
 * @tinytools/calc — deterministic, UI-independent calculation engine.
 *
 * No I/O, no system clock inside the math, no AI, no network. Money is integer
 * cents; time is whole minutes. Every calculator on tinytools.live consumes
 * these functions; nothing computes on its own.
 */

export * from "./errors.js";
export * from "./money.js";
export * from "./time.js";
export * from "./overtime.js";
export * from "./timecard.js";
export * from "./payConversion.js";
export * from "./workingHours.js";
// export * from "./paycheck/index.js"; // enabled in B3 once 2026 tax tables are researched + verified

/** Engine version — bump on any behaviour change; tax tables version separately. */
export const CALC_ENGINE_VERSION = "0.1.0";
