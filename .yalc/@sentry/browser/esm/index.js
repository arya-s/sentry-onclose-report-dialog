import { Integrations } from '@sentry/core';
export { FunctionToString, Hub, InboundFilters, ModuleMetadata, SDK_VERSION, Scope, addBreadcrumb, addGlobalEventProcessor, addIntegration, addTracingExtensions, captureEvent, captureException, captureMessage, close, configureScope, continueTrace, createTransport, extractTraceparentData, flush, getActiveSpan, getActiveTransaction, getCurrentHub, getHubFromCarrier, lastEventId, makeMain, makeMultiplexedTransport, setContext, setExtra, setExtras, setMeasurement, setTag, setTags, setUser, spanStatusfromHttpCode, startInactiveSpan, startSpan, startSpanManual, startTransaction, trace, withScope } from '@sentry/core';
import { WINDOW } from './helpers.js';
export { WINDOW } from './helpers.js';
export { BrowserClient } from './client.js';
export { makeFetchTransport } from './transports/fetch.js';
export { makeXHRTransport } from './transports/xhr.js';
export { chromeStackLineParser, defaultStackLineParsers, defaultStackParser, geckoStackLineParser, opera10StackLineParser, opera11StackLineParser, winjsStackLineParser } from './stack-parsers.js';
export { eventFromException, eventFromMessage, exceptionFromError } from './eventbuilder.js';
export { createUserFeedbackEnvelope } from './userfeedback.js';
export { captureUserFeedback, defaultIntegrations, forceLoad, init, onLoad, showReportDialog, wrap } from './sdk.js';
import * as index from './integrations/index.js';
export { Replay } from '@sentry/replay';
export { BrowserTracing, defaultRequestInstrumentationOptions, instrumentOutgoingRequests } from '@sentry-internal/tracing';
export { makeBrowserOfflineTransport } from './transports/offline.js';
export { onProfilingStartRouteTransaction } from './profiling/hubextensions.js';
export { BrowserProfilingIntegration } from './profiling/integration.js';
export { GlobalHandlers } from './integrations/globalhandlers.js';
export { TryCatch } from './integrations/trycatch.js';
export { Breadcrumbs } from './integrations/breadcrumbs.js';
export { LinkedErrors } from './integrations/linkederrors.js';
export { HttpContext } from './integrations/httpcontext.js';
export { Dedupe } from './integrations/dedupe.js';

let windowIntegrations = {};

// This block is needed to add compatibility with the integrations packages when used with a CDN
if (WINDOW.Sentry && WINDOW.Sentry.Integrations) {
  windowIntegrations = WINDOW.Sentry.Integrations;
}

const INTEGRATIONS = {
  ...windowIntegrations,
  ...Integrations,
  ...index,
};

export { INTEGRATIONS as Integrations };
//# sourceMappingURL=index.js.map
