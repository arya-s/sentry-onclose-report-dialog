import type { Breadcrumb, BreadcrumbHint, Client, CustomSamplingContext, Event, EventHint, Extra, Extras, Hub as HubInterface, Integration, IntegrationClass, Primitive, Session, SessionContext, Severity, SeverityLevel, Transaction, TransactionContext, User } from '@sentry/types';
import { Scope } from './scope';
/**
 * API compatibility version of this hub.
 *
 * WARNING: This number should only be increased when the global interface
 * changes and new methods are introduced.
 *
 * @hidden
 */
export declare const API_VERSION = 4;
export interface RunWithAsyncContextOptions {
    /** Whether to reuse an existing async context if one exists. Defaults to false. */
    reuseExisting?: boolean;
}
/**
 * @private Private API with no semver guarantees!
 *
 * Strategy used to track async context.
 */
export interface AsyncContextStrategy {
    /**
     * Gets the current async context. Returns undefined if there is no current async context.
     */
    getCurrentHub: () => Hub | undefined;
    /**
     * Runs the supplied callback in its own async context.
     */
    runWithAsyncContext<T>(callback: () => T, options: RunWithAsyncContextOptions): T;
}
/**
 * A layer in the process stack.
 * @hidden
 */
export interface Layer {
    client?: Client;
    scope: Scope;
}
/**
 * An object that contains a hub and maintains a scope stack.
 * @hidden
 */
export interface Carrier {
    __SENTRY__?: {
        hub?: Hub;
        acs?: AsyncContextStrategy;
        /**
         * Extra Hub properties injected by various SDKs
         */
        integrations?: Integration[];
        extensions?: {
            /** Extension methods for the hub, which are bound to the current Hub instance */
            [key: string]: Function;
        };
    };
}
/**
 * @inheritDoc
 */
export declare class Hub implements HubInterface {
    private readonly _version;
    /** Is a {@link Layer}[] containing the client and scope */
    private readonly _stack;
    /** Contains the last event id of a captured event.  */
    private _lastEventId?;
    /**
     * Creates a new instance of the hub, will push one {@link Layer} into the
     * internal stack on creation.
     *
     * @param client bound to the hub.
     * @param scope bound to the hub.
     * @param version number, higher number means higher priority.
     */
    constructor(client?: Client, scope?: Scope, _version?: number);
    /**
     * @inheritDoc
     */
    isOlderThan(version: number): boolean;
    /**
     * @inheritDoc
     */
    bindClient(client?: Client): void;
    /**
     * @inheritDoc
     */
    pushScope(): Scope;
    /**
     * @inheritDoc
     */
    popScope(): boolean;
    /**
     * @inheritDoc
     */
    withScope(callback: (scope: Scope) => void): void;
    /**
     * @inheritDoc
     */
    getClient<C extends Client>(): C | undefined;
    /** Returns the scope of the top stack. */
    getScope(): Scope;
    /** Returns the scope stack for domains or the process. */
    getStack(): Layer[];
    /** Returns the topmost scope layer in the order domain > local > process. */
    getStackTop(): Layer;
    /**
     * @inheritDoc
     */
    captureException(exception: unknown, hint?: EventHint): string;
    /**
     * @inheritDoc
     */
    captureMessage(message: string, level?: Severity | SeverityLevel, hint?: EventHint): string;
    /**
     * @inheritDoc
     */
    captureEvent(event: Event, hint?: EventHint): string;
    /**
     * @inheritDoc
     */
    lastEventId(): string | undefined;
    /**
     * @inheritDoc
     */
    addBreadcrumb(breadcrumb: Breadcrumb, hint?: BreadcrumbHint): void;
    /**
     * @inheritDoc
     */
    setUser(user: User | null): void;
    /**
     * @inheritDoc
     */
    setTags(tags: {
        [key: string]: Primitive;
    }): void;
    /**
     * @inheritDoc
     */
    setExtras(extras: Extras): void;
    /**
     * @inheritDoc
     */
    setTag(key: string, value: Primitive): void;
    /**
     * @inheritDoc
     */
    setExtra(key: string, extra: Extra): void;
    /**
     * @inheritDoc
     */
    setContext(name: string, context: {
        [key: string]: any;
    } | null): void;
    /**
     * @inheritDoc
     */
    configureScope(callback: (scope: Scope) => void): void;
    /**
     * @inheritDoc
     */
    run(callback: (hub: Hub) => void): void;
    /**
     * @inheritDoc
     */
    getIntegration<T extends Integration>(integration: IntegrationClass<T>): T | null;
    /**
     * @inheritDoc
     */
    startTransaction(context: TransactionContext, customSamplingContext?: CustomSamplingContext): Transaction;
    /**
     * @inheritDoc
     */
    traceHeaders(): {
        [key: string]: string;
    };
    /**
     * @inheritDoc
     */
    captureSession(endSession?: boolean): void;
    /**
     * @inheritDoc
     */
    endSession(): void;
    /**
     * @inheritDoc
     */
    startSession(context?: SessionContext): Session;
    /**
     * Returns if default PII should be sent to Sentry and propagated in ourgoing requests
     * when Tracing is used.
     */
    shouldSendDefaultPii(): boolean;
    /**
     * Sends the current Session on the scope
     */
    private _sendSessionUpdate;
    /**
     * Internal helper function to call a method on the top client if it exists.
     *
     * @param method The method to call on the client.
     * @param args Arguments to pass to the client function.
     */
    private _withClient;
    /**
     * Calls global extension method and binding current instance to the function call
     */
    private _callExtensionMethod;
}
/**
 * Returns the global shim registry.
 *
 * FIXME: This function is problematic, because despite always returning a valid Carrier,
 * it has an optional `__SENTRY__` property, which then in turn requires us to always perform an unnecessary check
 * at the call-site. We always access the carrier through this function, so we can guarantee that `__SENTRY__` is there.
 **/
export declare function getMainCarrier(): Carrier;
/**
 * Replaces the current main hub with the passed one on the global object
 *
 * @returns The old replaced hub
 */
export declare function makeMain(hub: Hub): Hub;
/**
 * Returns the default hub instance.
 *
 * If a hub is already registered in the global carrier but this module
 * contains a more recent version, it replaces the registered version.
 * Otherwise, the currently registered hub will be returned.
 */
export declare function getCurrentHub(): Hub;
/**
 * @private Private API with no semver guarantees!
 *
 * If the carrier does not contain a hub, a new hub is created with the global hub client and scope.
 */
export declare function ensureHubOnCarrier(carrier: Carrier, parent?: Hub): void;
/**
 * @private Private API with no semver guarantees!
 *
 * Sets the global async context strategy
 */
export declare function setAsyncContextStrategy(strategy: AsyncContextStrategy | undefined): void;
/**
 * Runs the supplied callback in its own async context. Async Context strategies are defined per SDK.
 *
 * @param callback The callback to run in its own async context
 * @param options Options to pass to the async context strategy
 * @returns The result of the callback
 */
export declare function runWithAsyncContext<T>(callback: () => T, options?: RunWithAsyncContextOptions): T;
/**
 * This will create a new {@link Hub} and add to the passed object on
 * __SENTRY__.hub.
 * @param carrier object
 * @hidden
 */
export declare function getHubFromCarrier(carrier: Carrier): Hub;
/**
 * This will set passed {@link Hub} on the passed object's __SENTRY__.hub attribute
 * @param carrier object
 * @param hub Hub
 * @returns A boolean indicating success or failure
 */
export declare function setHubOnCarrier(carrier: Carrier, hub: Hub): boolean;
//# sourceMappingURL=hub.d.ts.map