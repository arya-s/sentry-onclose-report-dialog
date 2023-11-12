Object.defineProperty(exports, '__esModule', { value: true });

const core = require('@sentry/core');
const utils = require('@sentry/utils');
const instrument = require('./instrument.js');

/* eslint-disable max-lines */

const DEFAULT_TRACE_PROPAGATION_TARGETS = ['localhost', /^\/(?!\/)/];

/** Options for Request Instrumentation */

const defaultRequestInstrumentationOptions = {
  traceFetch: true,
  traceXHR: true,
  enableHTTPTimings: true,
  // TODO (v8): Remove this property
  tracingOrigins: DEFAULT_TRACE_PROPAGATION_TARGETS,
  tracePropagationTargets: DEFAULT_TRACE_PROPAGATION_TARGETS,
};

/** Registers span creators for xhr and fetch requests  */
function instrumentOutgoingRequests(_options) {
  const {
    traceFetch,
    traceXHR,
    // eslint-disable-next-line deprecation/deprecation
    tracePropagationTargets,
    // eslint-disable-next-line deprecation/deprecation
    tracingOrigins,
    shouldCreateSpanForRequest,
    enableHTTPTimings,
  } = {
    traceFetch: defaultRequestInstrumentationOptions.traceFetch,
    traceXHR: defaultRequestInstrumentationOptions.traceXHR,
    ..._options,
  };

  const shouldCreateSpan =
    typeof shouldCreateSpanForRequest === 'function' ? shouldCreateSpanForRequest : (_) => true;

  // TODO(v8) Remove tracingOrigins here
  // The only reason we're passing it in here is because this instrumentOutgoingRequests function is publicly exported
  // and we don't want to break the API. We can remove it in v8.
  const shouldAttachHeadersWithTargets = (url) =>
    shouldAttachHeaders(url, tracePropagationTargets || tracingOrigins);

  const spans = {};

  if (traceFetch) {
    utils.addInstrumentationHandler('fetch', (handlerData) => {
      const createdSpan = fetchCallback(handlerData, shouldCreateSpan, shouldAttachHeadersWithTargets, spans);
      if (enableHTTPTimings && createdSpan) {
        addHTTPTimings(createdSpan);
      }
    });
  }

  if (traceXHR) {
    utils.addInstrumentationHandler('xhr', (handlerData) => {
      const createdSpan = xhrCallback(handlerData, shouldCreateSpan, shouldAttachHeadersWithTargets, spans);
      if (enableHTTPTimings && createdSpan) {
        addHTTPTimings(createdSpan);
      }
    });
  }
}

function isPerformanceResourceTiming(entry) {
  return (
    entry.entryType === 'resource' &&
    'initiatorType' in entry &&
    typeof (entry ).nextHopProtocol === 'string' &&
    (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest')
  );
}

/**
 * Creates a temporary observer to listen to the next fetch/xhr resourcing timings,
 * so that when timings hit their per-browser limit they don't need to be removed.
 *
 * @param span A span that has yet to be finished, must contain `url` on data.
 */
function addHTTPTimings(span) {
  const url = span.data.url;

  if (!url) {
    return;
  }

  const cleanup = instrument.addPerformanceInstrumentationHandler('resource', ({ entries }) => {
    entries.forEach(entry => {
      if (isPerformanceResourceTiming(entry) && entry.name.endsWith(url)) {
        const spanData = resourceTimingEntryToSpanData(entry);
        spanData.forEach(data => span.setData(...data));
        // In the next tick, clean this handler up
        // We have to wait here because otherwise this cleans itself up before it is fully done
        setTimeout(cleanup);
      }
    });
  });
}

/**
 * Converts ALPN protocol ids to name and version.
 *
 * (https://www.iana.org/assignments/tls-extensiontype-values/tls-extensiontype-values.xhtml#alpn-protocol-ids)
 * @param nextHopProtocol PerformanceResourceTiming.nextHopProtocol
 */
function extractNetworkProtocol(nextHopProtocol) {
  let name = 'unknown';
  let version = 'unknown';
  let _name = '';
  for (const char of nextHopProtocol) {
    // http/1.1 etc.
    if (char === '/') {
      [name, version] = nextHopProtocol.split('/');
      break;
    }
    // h2, h3 etc.
    if (!isNaN(Number(char))) {
      name = _name === 'h' ? 'http' : _name;
      version = nextHopProtocol.split(_name)[1];
      break;
    }
    _name += char;
  }
  if (_name === nextHopProtocol) {
    // webrtc, ftp, etc.
    name = _name;
  }
  return { name, version };
}

function getAbsoluteTime(time = 0) {
  return ((utils.browserPerformanceTimeOrigin || performance.timeOrigin) + time) / 1000;
}

function resourceTimingEntryToSpanData(resourceTiming) {
  const { name, version } = extractNetworkProtocol(resourceTiming.nextHopProtocol);

  const timingSpanData = [];

  timingSpanData.push(['network.protocol.version', version], ['network.protocol.name', name]);

  if (!utils.browserPerformanceTimeOrigin) {
    return timingSpanData;
  }
  return [
    ...timingSpanData,
    ['http.request.redirect_start', getAbsoluteTime(resourceTiming.redirectStart)],
    ['http.request.fetch_start', getAbsoluteTime(resourceTiming.fetchStart)],
    ['http.request.domain_lookup_start', getAbsoluteTime(resourceTiming.domainLookupStart)],
    ['http.request.domain_lookup_end', getAbsoluteTime(resourceTiming.domainLookupEnd)],
    ['http.request.connect_start', getAbsoluteTime(resourceTiming.connectStart)],
    ['http.request.secure_connection_start', getAbsoluteTime(resourceTiming.secureConnectionStart)],
    ['http.request.connection_end', getAbsoluteTime(resourceTiming.connectEnd)],
    ['http.request.request_start', getAbsoluteTime(resourceTiming.requestStart)],
    ['http.request.response_start', getAbsoluteTime(resourceTiming.responseStart)],
    ['http.request.response_end', getAbsoluteTime(resourceTiming.responseEnd)],
  ];
}

/**
 * A function that determines whether to attach tracing headers to a request.
 * This was extracted from `instrumentOutgoingRequests` to make it easier to test shouldAttachHeaders.
 * We only export this fuction for testing purposes.
 */
function shouldAttachHeaders(url, tracePropagationTargets) {
  return utils.stringMatchesSomePattern(url, tracePropagationTargets || DEFAULT_TRACE_PROPAGATION_TARGETS);
}

/**
 * Create and track fetch request spans
 *
 * @returns Span if a span was created, otherwise void.
 */
function fetchCallback(
  handlerData,
  shouldCreateSpan,
  shouldAttachHeaders,
  spans,
) {
  if (!core.hasTracingEnabled() || !handlerData.fetchData) {
    return undefined;
  }

  const shouldCreateSpanResult = shouldCreateSpan(handlerData.fetchData.url);

  if (handlerData.endTimestamp && shouldCreateSpanResult) {
    const spanId = handlerData.fetchData.__span;
    if (!spanId) return;

    const span = spans[spanId];
    if (span) {
      if (handlerData.response) {
        // TODO (kmclb) remove this once types PR goes through
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        span.setHttpStatus(handlerData.response.status);

        const contentLength =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          handlerData.response && handlerData.response.headers && handlerData.response.headers.get('content-length');

        const contentLengthNum = parseInt(contentLength);
        if (contentLengthNum > 0) {
          span.setData('http.response_content_length', contentLengthNum);
        }
      } else if (handlerData.error) {
        span.setStatus('internal_error');
      }
      span.finish();

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete spans[spanId];
    }
    return undefined;
  }

  const hub = core.getCurrentHub();
  const scope = hub.getScope();
  const client = hub.getClient();
  const parentSpan = scope.getSpan();

  const { method, url } = handlerData.fetchData;

  const span =
    shouldCreateSpanResult && parentSpan
      ? parentSpan.startChild({
          data: {
            url,
            type: 'fetch',
            'http.method': method,
          },
          description: `${method} ${url}`,
          op: 'http.client',
          origin: 'auto.http.browser',
        })
      : undefined;

  if (span) {
    handlerData.fetchData.__span = span.spanId;
    spans[span.spanId] = span;
  }

  if (shouldAttachHeaders(handlerData.fetchData.url) && client) {
    const request = handlerData.args[0];

    // In case the user hasn't set the second argument of a fetch call we default it to `{}`.
    handlerData.args[1] = handlerData.args[1] || {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = handlerData.args[1];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    options.headers = addTracingHeadersToFetchRequest(request, client, scope, options, span);
  }

  return span;
}

/**
 * Adds sentry-trace and baggage headers to the various forms of fetch headers
 */
function addTracingHeadersToFetchRequest(
  request, // unknown is actually type Request but we can't export DOM types from this package,
  client,
  scope,
  options

,
  requestSpan,
) {
  const span = requestSpan || scope.getSpan();

  const transaction = span && span.transaction;

  const { traceId, sampled, dsc } = scope.getPropagationContext();

  const sentryTraceHeader = span ? span.toTraceparent() : utils.generateSentryTraceHeader(traceId, undefined, sampled);
  const dynamicSamplingContext = transaction
    ? transaction.getDynamicSamplingContext()
    : dsc
    ? dsc
    : core.getDynamicSamplingContextFromClient(traceId, client, scope);

  const sentryBaggageHeader = utils.dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext);

  const headers =
    typeof Request !== 'undefined' && utils.isInstanceOf(request, Request) ? (request ).headers : options.headers;

  if (!headers) {
    return { 'sentry-trace': sentryTraceHeader, baggage: sentryBaggageHeader };
  } else if (typeof Headers !== 'undefined' && utils.isInstanceOf(headers, Headers)) {
    const newHeaders = new Headers(headers );

    newHeaders.append('sentry-trace', sentryTraceHeader);

    if (sentryBaggageHeader) {
      // If the same header is appended multiple times the browser will merge the values into a single request header.
      // Its therefore safe to simply push a "baggage" entry, even though there might already be another baggage header.
      newHeaders.append(utils.BAGGAGE_HEADER_NAME, sentryBaggageHeader);
    }

    return newHeaders ;
  } else if (Array.isArray(headers)) {
    const newHeaders = [...headers, ['sentry-trace', sentryTraceHeader]];

    if (sentryBaggageHeader) {
      // If there are multiple entries with the same key, the browser will merge the values into a single request header.
      // Its therefore safe to simply push a "baggage" entry, even though there might already be another baggage header.
      newHeaders.push([utils.BAGGAGE_HEADER_NAME, sentryBaggageHeader]);
    }

    return newHeaders ;
  } else {
    const existingBaggageHeader = 'baggage' in headers ? headers.baggage : undefined;
    const newBaggageHeaders = [];

    if (Array.isArray(existingBaggageHeader)) {
      newBaggageHeaders.push(...existingBaggageHeader);
    } else if (existingBaggageHeader) {
      newBaggageHeaders.push(existingBaggageHeader);
    }

    if (sentryBaggageHeader) {
      newBaggageHeaders.push(sentryBaggageHeader);
    }

    return {
      ...(headers ),
      'sentry-trace': sentryTraceHeader,
      baggage: newBaggageHeaders.length > 0 ? newBaggageHeaders.join(',') : undefined,
    };
  }
}

/**
 * Create and track xhr request spans
 *
 * @returns Span if a span was created, otherwise void.
 */
// eslint-disable-next-line complexity
function xhrCallback(
  handlerData,
  shouldCreateSpan,
  shouldAttachHeaders,
  spans,
) {
  const xhr = handlerData.xhr;
  const sentryXhrData = xhr && xhr[utils.SENTRY_XHR_DATA_KEY];

  if (!core.hasTracingEnabled() || (xhr && xhr.__sentry_own_request__) || !xhr || !sentryXhrData) {
    return undefined;
  }

  const shouldCreateSpanResult = shouldCreateSpan(sentryXhrData.url);

  // check first if the request has finished and is tracked by an existing span which should now end
  if (handlerData.endTimestamp && shouldCreateSpanResult) {
    const spanId = xhr.__sentry_xhr_span_id__;
    if (!spanId) return;

    const span = spans[spanId];
    if (span) {
      span.setHttpStatus(sentryXhrData.status_code);
      span.finish();

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete spans[spanId];
    }
    return undefined;
  }

  const hub = core.getCurrentHub();
  const scope = hub.getScope();
  const parentSpan = scope.getSpan();

  const span =
    shouldCreateSpanResult && parentSpan
      ? parentSpan.startChild({
          data: {
            ...sentryXhrData.data,
            type: 'xhr',
            'http.method': sentryXhrData.method,
            url: sentryXhrData.url,
          },
          description: `${sentryXhrData.method} ${sentryXhrData.url}`,
          op: 'http.client',
          origin: 'auto.http.browser',
        })
      : undefined;

  if (span) {
    xhr.__sentry_xhr_span_id__ = span.spanId;
    spans[xhr.__sentry_xhr_span_id__] = span;
  }

  if (xhr.setRequestHeader && shouldAttachHeaders(sentryXhrData.url)) {
    if (span) {
      const transaction = span && span.transaction;
      const dynamicSamplingContext = transaction && transaction.getDynamicSamplingContext();
      const sentryBaggageHeader = utils.dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext);
      setHeaderOnXhr(xhr, span.toTraceparent(), sentryBaggageHeader);
    } else {
      const client = hub.getClient();
      const { traceId, sampled, dsc } = scope.getPropagationContext();
      const sentryTraceHeader = utils.generateSentryTraceHeader(traceId, undefined, sampled);
      const dynamicSamplingContext =
        dsc || (client ? core.getDynamicSamplingContextFromClient(traceId, client, scope) : undefined);
      const sentryBaggageHeader = utils.dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext);
      setHeaderOnXhr(xhr, sentryTraceHeader, sentryBaggageHeader);
    }
  }

  return span;
}

function setHeaderOnXhr(
  xhr,
  sentryTraceHeader,
  sentryBaggageHeader,
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    xhr.setRequestHeader('sentry-trace', sentryTraceHeader);
    if (sentryBaggageHeader) {
      // From MDN: "If this method is called several times with the same header, the values are merged into one single request header."
      // We can therefore simply set a baggage header without checking what was there before
      // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      xhr.setRequestHeader(utils.BAGGAGE_HEADER_NAME, sentryBaggageHeader);
    }
  } catch (_) {
    // Error: InvalidStateError: Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.
  }
}

exports.DEFAULT_TRACE_PROPAGATION_TARGETS = DEFAULT_TRACE_PROPAGATION_TARGETS;
exports.addTracingHeadersToFetchRequest = addTracingHeadersToFetchRequest;
exports.defaultRequestInstrumentationOptions = defaultRequestInstrumentationOptions;
exports.extractNetworkProtocol = extractNetworkProtocol;
exports.fetchCallback = fetchCallback;
exports.instrumentOutgoingRequests = instrumentOutgoingRequests;
exports.shouldAttachHeaders = shouldAttachHeaders;
exports.xhrCallback = xhrCallback;
//# sourceMappingURL=request.js.map
