import { logger } from '@sentry/utils';
import { getMainCarrier } from '../hub.js';
import { registerErrorInstrumentation } from './errors.js';
import { IdleTransaction } from './idletransaction.js';
import { sampleTransaction } from './sampling.js';
import { Transaction } from './transaction.js';

/** Returns all trace headers that are currently on the top scope. */
function traceHeaders() {
  const scope = this.getScope();
  const span = scope.getSpan();

  return span
    ? {
        'sentry-trace': span.toTraceparent(),
      }
    : {};
}

/**
 * Creates a new transaction and adds a sampling decision if it doesn't yet have one.
 *
 * The Hub.startTransaction method delegates to this method to do its work, passing the Hub instance in as `this`, as if
 * it had been called on the hub directly. Exists as a separate function so that it can be injected into the class as an
 * "extension method."
 *
 * @param this: The Hub starting the transaction
 * @param transactionContext: Data used to configure the transaction
 * @param CustomSamplingContext: Optional data to be provided to the `tracesSampler` function (if any)
 *
 * @returns The new transaction
 *
 * @see {@link Hub.startTransaction}
 */
function _startTransaction(

  transactionContext,
  customSamplingContext,
) {
  const client = this.getClient();
  const options = (client && client.getOptions()) || {};

  const configInstrumenter = options.instrumenter || 'sentry';
  const transactionInstrumenter = transactionContext.instrumenter || 'sentry';

  if (configInstrumenter !== transactionInstrumenter) {
    (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) &&
      logger.error(
        `A transaction was started with instrumenter=\`${transactionInstrumenter}\`, but the SDK is configured with the \`${configInstrumenter}\` instrumenter.
The transaction will not be sampled. Please use the ${configInstrumenter} instrumentation to start transactions.`,
      );

    transactionContext.sampled = false;
  }

  let transaction = new Transaction(transactionContext, this);
  transaction = sampleTransaction(transaction, options, {
    parentSampled: transactionContext.parentSampled,
    transactionContext,
    ...customSamplingContext,
  });
  if (transaction.sampled) {
    transaction.initSpanRecorder(options._experiments && (options._experiments.maxSpans ));
  }
  if (client && client.emit) {
    client.emit('startTransaction', transaction);
  }
  return transaction;
}

/**
 * Create new idle transaction.
 */
function startIdleTransaction(
  hub,
  transactionContext,
  idleTimeout,
  finalTimeout,
  onScope,
  customSamplingContext,
  heartbeatInterval,
) {
  const client = hub.getClient();
  const options = (client && client.getOptions()) || {};

  let transaction = new IdleTransaction(transactionContext, hub, idleTimeout, finalTimeout, heartbeatInterval, onScope);
  transaction = sampleTransaction(transaction, options, {
    parentSampled: transactionContext.parentSampled,
    transactionContext,
    ...customSamplingContext,
  });
  if (transaction.sampled) {
    transaction.initSpanRecorder(options._experiments && (options._experiments.maxSpans ));
  }
  if (client && client.emit) {
    client.emit('startTransaction', transaction);
  }
  return transaction;
}

/**
 * Adds tracing extensions to the global hub.
 */
function addTracingExtensions() {
  const carrier = getMainCarrier();
  if (!carrier.__SENTRY__) {
    return;
  }
  carrier.__SENTRY__.extensions = carrier.__SENTRY__.extensions || {};
  if (!carrier.__SENTRY__.extensions.startTransaction) {
    carrier.__SENTRY__.extensions.startTransaction = _startTransaction;
  }
  if (!carrier.__SENTRY__.extensions.traceHeaders) {
    carrier.__SENTRY__.extensions.traceHeaders = traceHeaders;
  }

  registerErrorInstrumentation();
}

export { addTracingExtensions, startIdleTransaction };
//# sourceMappingURL=hubextensions.js.map
