Object.defineProperty(exports, '__esModule', { value: true });

const core = require('@sentry/core');
const helpers = require('./helpers.js');
const client = require('./client.js');
const fetch = require('./transports/fetch.js');
const xhr = require('./transports/xhr.js');
const stackParsers = require('./stack-parsers.js');
const eventbuilder = require('./eventbuilder.js');
const userfeedback = require('./userfeedback.js');
const sdk = require('./sdk.js');
const index = require('./integrations/index.js');
const replay = require('@sentry/replay');
const tracing = require('@sentry-internal/tracing');
const offline = require('./transports/offline.js');
const hubextensions = require('./profiling/hubextensions.js');
const integration = require('./profiling/integration.js');
const globalhandlers = require('./integrations/globalhandlers.js');
const trycatch = require('./integrations/trycatch.js');
const breadcrumbs = require('./integrations/breadcrumbs.js');
const linkederrors = require('./integrations/linkederrors.js');
const httpcontext = require('./integrations/httpcontext.js');
const dedupe = require('./integrations/dedupe.js');

let windowIntegrations = {};

// This block is needed to add compatibility with the integrations packages when used with a CDN
if (helpers.WINDOW.Sentry && helpers.WINDOW.Sentry.Integrations) {
  windowIntegrations = helpers.WINDOW.Sentry.Integrations;
}

const INTEGRATIONS = {
  ...windowIntegrations,
  ...core.Integrations,
  ...index,
};

exports.FunctionToString = core.FunctionToString;
exports.Hub = core.Hub;
exports.InboundFilters = core.InboundFilters;
exports.ModuleMetadata = core.ModuleMetadata;
exports.SDK_VERSION = core.SDK_VERSION;
exports.Scope = core.Scope;
exports.addBreadcrumb = core.addBreadcrumb;
exports.addGlobalEventProcessor = core.addGlobalEventProcessor;
exports.addIntegration = core.addIntegration;
exports.addTracingExtensions = core.addTracingExtensions;
exports.captureEvent = core.captureEvent;
exports.captureException = core.captureException;
exports.captureMessage = core.captureMessage;
exports.close = core.close;
exports.configureScope = core.configureScope;
exports.continueTrace = core.continueTrace;
exports.createTransport = core.createTransport;
exports.extractTraceparentData = core.extractTraceparentData;
exports.flush = core.flush;
exports.getActiveSpan = core.getActiveSpan;
exports.getActiveTransaction = core.getActiveTransaction;
exports.getCurrentHub = core.getCurrentHub;
exports.getHubFromCarrier = core.getHubFromCarrier;
exports.lastEventId = core.lastEventId;
exports.makeMain = core.makeMain;
exports.makeMultiplexedTransport = core.makeMultiplexedTransport;
exports.setContext = core.setContext;
exports.setExtra = core.setExtra;
exports.setExtras = core.setExtras;
exports.setMeasurement = core.setMeasurement;
exports.setTag = core.setTag;
exports.setTags = core.setTags;
exports.setUser = core.setUser;
exports.spanStatusfromHttpCode = core.spanStatusfromHttpCode;
exports.startInactiveSpan = core.startInactiveSpan;
exports.startSpan = core.startSpan;
exports.startSpanManual = core.startSpanManual;
exports.startTransaction = core.startTransaction;
exports.trace = core.trace;
exports.withScope = core.withScope;
exports.WINDOW = helpers.WINDOW;
exports.BrowserClient = client.BrowserClient;
exports.makeFetchTransport = fetch.makeFetchTransport;
exports.makeXHRTransport = xhr.makeXHRTransport;
exports.chromeStackLineParser = stackParsers.chromeStackLineParser;
exports.defaultStackLineParsers = stackParsers.defaultStackLineParsers;
exports.defaultStackParser = stackParsers.defaultStackParser;
exports.geckoStackLineParser = stackParsers.geckoStackLineParser;
exports.opera10StackLineParser = stackParsers.opera10StackLineParser;
exports.opera11StackLineParser = stackParsers.opera11StackLineParser;
exports.winjsStackLineParser = stackParsers.winjsStackLineParser;
exports.eventFromException = eventbuilder.eventFromException;
exports.eventFromMessage = eventbuilder.eventFromMessage;
exports.exceptionFromError = eventbuilder.exceptionFromError;
exports.createUserFeedbackEnvelope = userfeedback.createUserFeedbackEnvelope;
exports.captureUserFeedback = sdk.captureUserFeedback;
exports.defaultIntegrations = sdk.defaultIntegrations;
exports.forceLoad = sdk.forceLoad;
exports.init = sdk.init;
exports.onLoad = sdk.onLoad;
exports.showReportDialog = sdk.showReportDialog;
exports.wrap = sdk.wrap;
exports.Replay = replay.Replay;
exports.BrowserTracing = tracing.BrowserTracing;
exports.defaultRequestInstrumentationOptions = tracing.defaultRequestInstrumentationOptions;
exports.instrumentOutgoingRequests = tracing.instrumentOutgoingRequests;
exports.makeBrowserOfflineTransport = offline.makeBrowserOfflineTransport;
exports.onProfilingStartRouteTransaction = hubextensions.onProfilingStartRouteTransaction;
exports.BrowserProfilingIntegration = integration.BrowserProfilingIntegration;
exports.GlobalHandlers = globalhandlers.GlobalHandlers;
exports.TryCatch = trycatch.TryCatch;
exports.Breadcrumbs = breadcrumbs.Breadcrumbs;
exports.LinkedErrors = linkederrors.LinkedErrors;
exports.HttpContext = httpcontext.HttpContext;
exports.Dedupe = dedupe.Dedupe;
exports.Integrations = INTEGRATIONS;
//# sourceMappingURL=index.js.map
