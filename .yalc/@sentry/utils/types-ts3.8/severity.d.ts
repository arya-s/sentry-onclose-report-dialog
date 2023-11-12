import { Severity, SeverityLevel } from '@sentry/types';
export declare const validSeverityLevels: string[];
/**
 * Converts a string-based level into a member of the deprecated {@link Severity} enum.
 *
 * @deprecated `severityFromString` is deprecated. Please use `severityLevelFromString` instead.
 *
 * @param level String representation of Severity
 * @returns Severity
 */
export declare function severityFromString(level: Severity | SeverityLevel | string): Severity;
/**
 * Converts a string-based level into a `SeverityLevel`, normalizing it along the way.
 *
 * @param level String representation of desired `SeverityLevel`.
 * @returns The `SeverityLevel` corresponding to the given string, or 'log' if the string isn't a valid level.
 */
export declare function severityLevelFromString(level: SeverityLevel | string): SeverityLevel;
//# sourceMappingURL=severity.d.ts.map
