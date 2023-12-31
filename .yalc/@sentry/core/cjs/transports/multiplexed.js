Object.defineProperty(exports, '__esModule', { value: true });

const utils = require('@sentry/utils');
const api = require('../api.js');

/**
 * Gets an event from an envelope.
 *
 * This is only exported for use in the tests
 */
function eventFromEnvelope(env, types) {
  let event;

  utils.forEachEnvelopeItem(env, (item, type) => {
    if (types.includes(type)) {
      event = Array.isArray(item) ? (item )[1] : undefined;
    }
    // bail out if we found an event
    return !!event;
  });

  return event;
}

/**
 * Creates a transport that overrides the release on all events.
 */
function makeOverrideReleaseTransport(
  createTransport,
  release,
) {
  return options => {
    const transport = createTransport(options);

    return {
      send: async (envelope) => {
        const event = eventFromEnvelope(envelope, ['event', 'transaction', 'profile', 'replay_event']);

        if (event) {
          event.release = release;
        }
        return transport.send(envelope);
      },
      flush: timeout => transport.flush(timeout),
    };
  };
}

/**
 * Creates a transport that can send events to different DSNs depending on the envelope contents.
 */
function makeMultiplexedTransport(
  createTransport,
  matcher,
) {
  return options => {
    const fallbackTransport = createTransport(options);
    const otherTransports = {};

    function getTransport(dsn, release) {
      // We create a transport for every unique dsn/release combination as there may be code from multiple releases in
      // use at the same time
      const key = release ? `${dsn}:${release}` : dsn;

      if (!otherTransports[key]) {
        const validatedDsn = utils.dsnFromString(dsn);
        if (!validatedDsn) {
          return undefined;
        }
        const url = api.getEnvelopeEndpointWithUrlEncodedAuth(validatedDsn);

        otherTransports[key] = release
          ? makeOverrideReleaseTransport(createTransport, release)({ ...options, url })
          : createTransport({ ...options, url });
      }

      return otherTransports[key];
    }

    async function send(envelope) {
      function getEvent(types) {
        const eventTypes = types && types.length ? types : ['event'];
        return eventFromEnvelope(envelope, eventTypes);
      }

      const transports = matcher({ envelope, getEvent })
        .map(result => {
          if (typeof result === 'string') {
            return getTransport(result, undefined);
          } else {
            return getTransport(result.dsn, result.release);
          }
        })
        .filter((t) => !!t);

      // If we have no transports to send to, use the fallback transport
      if (transports.length === 0) {
        transports.push(fallbackTransport);
      }

      const results = await Promise.all(transports.map(transport => transport.send(envelope)));

      return results[0];
    }

    async function flush(timeout) {
      const allTransports = [...Object.keys(otherTransports).map(dsn => otherTransports[dsn]), fallbackTransport];
      const results = await Promise.all(allTransports.map(transport => transport.flush(timeout)));
      return results.every(r => r);
    }

    return {
      send,
      flush,
    };
  };
}

exports.eventFromEnvelope = eventFromEnvelope;
exports.makeMultiplexedTransport = makeMultiplexedTransport;
//# sourceMappingURL=multiplexed.js.map
