import { Attachment, Breadcrumb, CaptureContext, Context, Contexts, Event, EventHint, EventProcessor, Extra, Extras, Primitive, PropagationContext, RequestSession, Scope as ScopeInterface, Session, Severity, SeverityLevel, Span, Transaction, User } from '@sentry/types';
/**
 * Holds additional event information. {@link Scope.applyToEvent} will be
 * called by the client before an event will be sent.
 */
export declare class Scope implements ScopeInterface {
    /** Flag if notifying is happening. */
    protected _notifyingListeners: boolean;
    /** Callback for client to receive scope changes. */
    protected _scopeListeners: Array<(scope: Scope) => void>;
    /** Callback list that will be called after {@link applyToEvent}. */
    protected _eventProcessors: EventProcessor[];
    /** Array of breadcrumbs. */
    protected _breadcrumbs: Breadcrumb[];
    /** User */
    protected _user: User;
    /** Tags */
    protected _tags: {
        [key: string]: Primitive;
    };
    /** Extra */
    protected _extra: Extras;
    /** Contexts */
    protected _contexts: Contexts;
    /** Attachments */
    protected _attachments: Attachment[];
    /** Propagation Context for distributed tracing */
    protected _propagationContext: PropagationContext;
    /**
     * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
     * sent to Sentry
     */
    protected _sdkProcessingMetadata: {
        [key: string]: unknown;
    };
    /** Fingerprint */
    protected _fingerprint?: string[];
    /** Severity */
    protected _level?: Severity | SeverityLevel;
    /** Transaction Name */
    protected _transactionName?: string;
    /** Span */
    protected _span?: Span;
    /** Session */
    protected _session?: Session;
    /** Request Mode Session Status */
    protected _requestSession?: RequestSession;
    constructor();
    /**
     * Inherit values from the parent scope.
     * @param scope to clone.
     */
    static clone(scope?: Scope): Scope;
    /**
     * Add internal on change listener. Used for sub SDKs that need to store the scope.
     * @hidden
     */
    addScopeListener(callback: (scope: Scope) => void): void;
    /**
     * @inheritDoc
     */
    addEventProcessor(callback: EventProcessor): this;
    /**
     * @inheritDoc
     */
    setUser(user: User | null): this;
    /**
     * @inheritDoc
     */
    getUser(): User | undefined;
    /**
     * @inheritDoc
     */
    getRequestSession(): RequestSession | undefined;
    /**
     * @inheritDoc
     */
    setRequestSession(requestSession?: RequestSession): this;
    /**
     * @inheritDoc
     */
    setTags(tags: {
        [key: string]: Primitive;
    }): this;
    /**
     * @inheritDoc
     */
    setTag(key: string, value: Primitive): this;
    /**
     * @inheritDoc
     */
    setExtras(extras: Extras): this;
    /**
     * @inheritDoc
     */
    setExtra(key: string, extra: Extra): this;
    /**
     * @inheritDoc
     */
    setFingerprint(fingerprint: string[]): this;
    /**
     * @inheritDoc
     */
    setLevel(level: Severity | SeverityLevel): this;
    /**
     * @inheritDoc
     */
    setTransactionName(name?: string): this;
    /**
     * @inheritDoc
     */
    setContext(key: string, context: Context | null): this;
    /**
     * @inheritDoc
     */
    setSpan(span?: Span): this;
    /**
     * @inheritDoc
     */
    getSpan(): Span | undefined;
    /**
     * @inheritDoc
     */
    getTransaction(): Transaction | undefined;
    /**
     * @inheritDoc
     */
    setSession(session?: Session): this;
    /**
     * @inheritDoc
     */
    getSession(): Session | undefined;
    /**
     * @inheritDoc
     */
    update(captureContext?: CaptureContext): this;
    /**
     * @inheritDoc
     */
    clear(): this;
    /**
     * @inheritDoc
     */
    addBreadcrumb(breadcrumb: Breadcrumb, maxBreadcrumbs?: number): this;
    /**
     * @inheritDoc
     */
    getLastBreadcrumb(): Breadcrumb | undefined;
    /**
     * @inheritDoc
     */
    clearBreadcrumbs(): this;
    /**
     * @inheritDoc
     */
    addAttachment(attachment: Attachment): this;
    /**
     * @inheritDoc
     */
    getAttachments(): Attachment[];
    /**
     * @inheritDoc
     */
    clearAttachments(): this;
    /**
     * Applies data from the scope to the event and runs all event processors on it.
     *
     * @param event Event
     * @param hint Object containing additional information about the original exception, for use by the event processors.
     * @hidden
     */
    applyToEvent(event: Event, hint?: EventHint, additionalEventProcessors?: EventProcessor[]): PromiseLike<Event | null>;
    /**
     * Add data which will be accessible during event processing but won't get sent to Sentry
     */
    setSDKProcessingMetadata(newData: {
        [key: string]: unknown;
    }): this;
    /**
     * @inheritDoc
     */
    setPropagationContext(context: PropagationContext): this;
    /**
     * @inheritDoc
     */
    getPropagationContext(): PropagationContext;
    /**
     * Get the breadcrumbs for this scope.
     */
    protected _getBreadcrumbs(): Breadcrumb[];
    /**
     * This will be called on every set call.
     */
    protected _notifyScopeListeners(): void;
    /**
     * Applies fingerprint from the scope to the event if there's one,
     * uses message if there's one instead or get rid of empty fingerprint
     */
    private _applyFingerprint;
}
//# sourceMappingURL=scope.d.ts.map
