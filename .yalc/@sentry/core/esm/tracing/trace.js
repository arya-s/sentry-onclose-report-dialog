import { isThenable, tracingContextFromHeaders, logger, dropUndefinedKeys } from '@sentry/utils';
import { getCurrentHub } from '../hub.js';
import { hasTracingEnabled } from '../utils/hasTracingEnabled.js';

/**
 * Wraps a function with a transaction/span and finishes the span after the function is done.
 *
 * Note that if you have not enabled tracing extensions via `addTracingExtensions`
 * or you didn't set `tracesSampleRate`, this function will not generate spans
 * and the `span` returned from the callback will be undefined.
 *
 * This function is meant to be used internally and may break at any time. Use at your own risk.
 *
 * @internal
 * @private
 */
function trace(
  context,
  callback,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onError = () => {},
) {
  const ctx = normalizeContext(context);

  const hub = getCurrentHub();
  const scope = hub.getScope();
  const parentSpan = scope.getSpan();

  const activeSpan = createChildSpanOrTransaction(hub, parentSpan, ctx);

  scope.setSpan(activeSpan);

  function finishAndSetSpan() {
    activeSpan && activeSpan.finish();
    hub.getScope().setSpan(parentSpan);
  }

  let maybePromiseResult;
  try {
    maybePromiseResult = callback(activeSpan);
  } catch (e) {
    activeSpan && activeSpan.setStatus('internal_error');
    onError(e);
    finishAndSetSpan();
    throw e;
  }

  if (isThenable(maybePromiseResult)) {
    Promise.resolve(maybePromiseResult).then(
      () => {
        finishAndSetSpan();
      },
      e => {
        activeSpan && activeSpan.setStatus('internal_error');
        onError(e);
        finishAndSetSpan();
      },
    );
  } else {
    finishAndSetSpan();
  }

  return maybePromiseResult;
}

/**
 * Wraps a function with a transaction/span and finishes the span after the function is done.
 * The created span is the active span and will be used as parent by other spans created inside the function
 * and can be accessed via `Sentry.getSpan()`, as long as the function is executed while the scope is active.
 *
 * If you want to create a span that is not set as active, use {@link startInactiveSpan}.
 *
 * Note that if you have not enabled tracing extensions via `addTracingExtensions`
 * or you didn't set `tracesSampleRate`, this function will not generate spans
 * and the `span` returned from the callback will be undefined.
 */
function startSpan(context, callback) {
  const ctx = normalizeContext(context);

  const hub = getCurrentHub();
  const scope = hub.getScope();
  const parentSpan = scope.getSpan();

  const activeSpan = createChildSpanOrTransaction(hub, parentSpan, ctx);
  scope.setSpan(activeSpan);

  function finishAndSetSpan() {
    activeSpan && activeSpan.finish();
    hub.getScope().setSpan(parentSpan);
  }

  let maybePromiseResult;
  try {
    maybePromiseResult = callback(activeSpan);
  } catch (e) {
    activeSpan && activeSpan.setStatus('internal_error');
    finishAndSetSpan();
    throw e;
  }

  if (isThenable(maybePromiseResult)) {
    Promise.resolve(maybePromiseResult).then(
      () => {
        finishAndSetSpan();
      },
      () => {
        activeSpan && activeSpan.setStatus('internal_error');
        finishAndSetSpan();
      },
    );
  } else {
    finishAndSetSpan();
  }

  return maybePromiseResult;
}

/**
 * @deprecated Use {@link startSpan} instead.
 */
const startActiveSpan = startSpan;

/**
 * Similar to `Sentry.startSpan`. Wraps a function with a transaction/span, but does not finish the span
 * after the function is done automatically.
 *
 * The created span is the active span and will be used as parent by other spans created inside the function
 * and can be accessed via `Sentry.getActiveSpan()`, as long as the function is executed while the scope is active.
 *
 * Note that if you have not enabled tracing extensions via `addTracingExtensions`
 * or you didn't set `tracesSampleRate`, this function will not generate spans
 * and the `span` returned from the callback will be undefined.
 */
function startSpanManual(
  context,
  callback,
) {
  const ctx = normalizeContext(context);

  const hub = getCurrentHub();
  const scope = hub.getScope();
  const parentSpan = scope.getSpan();

  const activeSpan = createChildSpanOrTransaction(hub, parentSpan, ctx);
  scope.setSpan(activeSpan);

  function finishAndSetSpan() {
    activeSpan && activeSpan.finish();
    hub.getScope().setSpan(parentSpan);
  }

  let maybePromiseResult;
  try {
    maybePromiseResult = callback(activeSpan, finishAndSetSpan);
  } catch (e) {
    activeSpan && activeSpan.setStatus('internal_error');
    throw e;
  }

  if (isThenable(maybePromiseResult)) {
    Promise.resolve(maybePromiseResult).then(undefined, () => {
      activeSpan && activeSpan.setStatus('internal_error');
    });
  }

  return maybePromiseResult;
}

/**
 * Creates a span. This span is not set as active, so will not get automatic instrumentation spans
 * as children or be able to be accessed via `Sentry.getSpan()`.
 *
 * If you want to create a span that is set as active, use {@link startSpan}.
 *
 * Note that if you have not enabled tracing extensions via `addTracingExtensions`
 * or you didn't set `tracesSampleRate` or `tracesSampler`, this function will not generate spans
 * and the `span` returned from the callback will be undefined.
 */
function startInactiveSpan(context) {
  if (!hasTracingEnabled()) {
    return undefined;
  }

  const ctx = { ...context };
  // If a name is set and a description is not, set the description to the name.
  if (ctx.name !== undefined && ctx.description === undefined) {
    ctx.description = ctx.name;
  }

  const hub = getCurrentHub();
  const parentSpan = getActiveSpan();
  return parentSpan ? parentSpan.startChild(ctx) : hub.startTransaction(ctx);
}

/**
 * Returns the currently active span.
 */
function getActiveSpan() {
  return getCurrentHub().getScope().getSpan();
}

/**
 * Continue a trace from `sentry-trace` and `baggage` values.
 * These values can be obtained from incoming request headers,
 * or in the browser from `<meta name="sentry-trace">` and `<meta name="baggage">` HTML tags.
 *
 * It also takes an optional `request` option, which if provided will also be added to the scope & transaction metadata.
 * The callback receives a transactionContext that may be used for `startTransaction` or `startSpan`.
 */
function continueTrace(
  {
    sentryTrace,
    baggage,
  }

,
  callback,
) {
  const hub = getCurrentHub();
  const currentScope = hub.getScope();

  const { traceparentData, dynamicSamplingContext, propagationContext } = tracingContextFromHeaders(
    sentryTrace,
    baggage,
  );

  currentScope.setPropagationContext(propagationContext);

  if ((typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) && traceparentData) {
    logger.log(`[Tracing] Continuing trace ${traceparentData.traceId}.`);
  }

  const transactionContext = {
    ...traceparentData,
    metadata: dropUndefinedKeys({
      dynamicSamplingContext: traceparentData && !dynamicSamplingContext ? {} : dynamicSamplingContext,
    }),
  };

  if (!callback) {
    return transactionContext;
  }

  return callback(transactionContext);
}

function createChildSpanOrTransaction(
  hub,
  parentSpan,
  ctx,
) {
  if (!hasTracingEnabled()) {
    return undefined;
  }
  return parentSpan ? parentSpan.startChild(ctx) : hub.startTransaction(ctx);
}

function normalizeContext(context) {
  const ctx = { ...context };
  // If a name is set and a description is not, set the description to the name.
  if (ctx.name !== undefined && ctx.description === undefined) {
    ctx.description = ctx.name;
  }

  return ctx;
}

export { continueTrace, getActiveSpan, startActiveSpan, startInactiveSpan, startSpan, startSpanManual, trace };
//# sourceMappingURL=trace.js.map
