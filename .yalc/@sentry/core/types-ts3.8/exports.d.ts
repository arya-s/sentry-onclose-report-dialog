import { Breadcrumb, CaptureContext, CheckIn, CustomSamplingContext, Event, EventHint, Extra, Extras, MonitorConfig, Primitive, Severity, SeverityLevel, TransactionContext, User } from '@sentry/types';
import { Hub } from './hub';
import { Scope } from './scope';
/**
 * Captures an exception event and sends it to Sentry.
 *
 * @param exception An exception-like object.
 * @param captureContext Additional scope data to apply to exception event.
 * @returns The generated eventId.
 */
export declare function captureException(exception: any, captureContext?: CaptureContext): ReturnType<Hub['captureException']>;
/**
 * Captures a message event and sends it to Sentry.
 *
 * @param message The message to send to Sentry.
 * @param Severity Define the level of the message.
 * @returns The generated eventId.
 */
export declare function captureMessage(message: string, captureContext?: CaptureContext | Severity | SeverityLevel): ReturnType<Hub['captureMessage']>;
/**
 * Captures a manually created event and sends it to Sentry.
 *
 * @param event The event to send to Sentry.
 * @returns The generated eventId.
 */
export declare function captureEvent(event: Event, hint?: EventHint): ReturnType<Hub['captureEvent']>;
/**
 * Callback to set context information onto the scope.
 * @param callback Callback function that receives Scope.
 */
export declare function configureScope(callback: (scope: Scope) => void): ReturnType<Hub['configureScope']>;
/**
 * Records a new breadcrumb which will be attached to future events.
 *
 * Breadcrumbs will be added to subsequent events to provide more context on
 * user's actions prior to an error or crash.
 *
 * @param breadcrumb The breadcrumb to record.
 */
export declare function addBreadcrumb(breadcrumb: Breadcrumb): ReturnType<Hub['addBreadcrumb']>;
/**
 * Sets context data with the given name.
 * @param name of the context
 * @param context Any kind of data. This data will be normalized.
 */
export declare function setContext(name: string, context: {
    [key: string]: any;
} | null): ReturnType<Hub['setContext']>;
/**
 * Set an object that will be merged sent as extra data with the event.
 * @param extras Extras object to merge into current context.
 */
export declare function setExtras(extras: Extras): ReturnType<Hub['setExtras']>;
/**
 * Set key:value that will be sent as extra data with the event.
 * @param key String of extra
 * @param extra Any kind of data. This data will be normalized.
 */
export declare function setExtra(key: string, extra: Extra): ReturnType<Hub['setExtra']>;
/**
 * Set an object that will be merged sent as tags data with the event.
 * @param tags Tags context object to merge into current context.
 */
export declare function setTags(tags: {
    [key: string]: Primitive;
}): ReturnType<Hub['setTags']>;
/**
 * Set key:value that will be sent as tags data with the event.
 *
 * Can also be used to unset a tag, by passing `undefined`.
 *
 * @param key String key of tag
 * @param value Value of tag
 */
export declare function setTag(key: string, value: Primitive): ReturnType<Hub['setTag']>;
/**
 * Updates user context information for future events.
 *
 * @param user User context object to be set in the current context. Pass `null` to unset the user.
 */
export declare function setUser(user: User | null): ReturnType<Hub['setUser']>;
/**
 * Creates a new scope with and executes the given operation within.
 * The scope is automatically removed once the operation
 * finishes or throws.
 *
 * This is essentially a convenience function for:
 *
 *     pushScope();
 *     callback();
 *     popScope();
 *
 * @param callback that will be enclosed into push/popScope.
 */
export declare function withScope(callback: (scope: Scope) => void): ReturnType<Hub['withScope']>;
/**
 * Starts a new `Transaction` and returns it. This is the entry point to manual tracing instrumentation.
 *
 * A tree structure can be built by adding child spans to the transaction, and child spans to other spans. To start a
 * new child span within the transaction or any span, call the respective `.startChild()` method.
 *
 * Every child span must be finished before the transaction is finished, otherwise the unfinished spans are discarded.
 *
 * The transaction must be finished with a call to its `.finish()` method, at which point the transaction with all its
 * finished child spans will be sent to Sentry.
 *
 * NOTE: This function should only be used for *manual* instrumentation. Auto-instrumentation should call
 * `startTransaction` directly on the hub.
 *
 * @param context Properties of the new `Transaction`.
 * @param customSamplingContext Information given to the transaction sampling function (along with context-dependent
 * default values). See {@link Options.tracesSampler}.
 *
 * @returns The transaction which was just started
 */
export declare function startTransaction(context: TransactionContext, customSamplingContext?: CustomSamplingContext): ReturnType<Hub['startTransaction']>;
/**
 * Create a cron monitor check in and send it to Sentry.
 *
 * @param checkIn An object that describes a check in.
 * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
 * to create a monitor automatically when sending a check in.
 */
export declare function captureCheckIn(checkIn: CheckIn, upsertMonitorConfig?: MonitorConfig): string;
/**
 * Wraps a callback with a cron monitor check in. The check in will be sent to Sentry when the callback finishes.
 *
 * @param monitorSlug The distinct slug of the monitor.
 * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
 * to create a monitor automatically when sending a check in.
 */
export declare function withMonitor<T>(monitorSlug: CheckIn['monitorSlug'], callback: () => T, upsertMonitorConfig?: MonitorConfig): T;
/**
 * Call `flush()` on the current client, if there is one. See {@link Client.flush}.
 *
 * @param timeout Maximum time in ms the client should wait to flush its event queue. Omitting this parameter will cause
 * the client to wait until all events are sent before resolving the promise.
 * @returns A promise which resolves to `true` if the queue successfully drains before the timeout, or `false` if it
 * doesn't (or if there's no client defined).
 */
export declare function flush(timeout?: number): Promise<boolean>;
/**
 * Call `close()` on the current client, if there is one. See {@link Client.close}.
 *
 * @param timeout Maximum time in ms the client should wait to flush its event queue before shutting down. Omitting this
 * parameter will cause the client to wait until all events are sent before disabling itself.
 * @returns A promise which resolves to `true` if the queue successfully drains before the timeout, or `false` if it
 * doesn't (or if there's no client defined).
 */
export declare function close(timeout?: number): Promise<boolean>;
/**
 * This is the getter for lastEventId.
 *
 * @returns The last event id of a captured event.
 */
export declare function lastEventId(): string | undefined;
//# sourceMappingURL=exports.d.ts.map
