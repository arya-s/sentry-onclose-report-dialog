Object.defineProperty(exports, '__esModule', { value: true });

const utils$1 = require('@sentry/utils');
const hubextensions = require('./hubextensions.js');
const utils = require('./utils.js');

/**
 * Browser profiling integration. Stores any event that has contexts["profile"]["profile_id"]
 * This exists because we do not want to await async profiler.stop calls as transaction.finish is called
 * in a synchronous context. Instead, we handle sending the profile async from the promise callback and
 * rely on being able to pull the event from the cache when we need to construct the envelope. This makes the
 * integration less reliable as we might be dropping profiles when the cache is full.
 *
 * @experimental
 */
class BrowserProfilingIntegration  {
   static __initStatic() {this.id = 'BrowserProfilingIntegration';}

   constructor() {
    this.name = BrowserProfilingIntegration.id;
  }

  /**
   * @inheritDoc
   */
   setupOnce(_addGlobalEventProcessor, getCurrentHub) {
    this.getCurrentHub = getCurrentHub;

    const hub = this.getCurrentHub();
    const client = hub.getClient();
    const scope = hub.getScope();

    const transaction = scope.getTransaction();

    if (transaction && utils.isAutomatedPageLoadTransaction(transaction)) {
      if (utils.shouldProfileTransaction(transaction)) {
        hubextensions.startProfileForTransaction(transaction);
      }
    }

    if (client && typeof client.on === 'function') {
      client.on('startTransaction', (transaction) => {
        if (utils.shouldProfileTransaction(transaction)) {
          hubextensions.startProfileForTransaction(transaction);
        }
      });

      client.on('beforeEnvelope', (envelope) => {
        // if not profiles are in queue, there is nothing to add to the envelope.
        if (!utils.getActiveProfilesCount()) {
          return;
        }

        const profiledTransactionEvents = utils.findProfiledTransactionsFromEnvelope(envelope);
        if (!profiledTransactionEvents.length) {
          return;
        }

        const profilesToAddToEnvelope = [];

        for (const profiledTransaction of profiledTransactionEvents) {
          const context = profiledTransaction && profiledTransaction.contexts;
          const profile_id = context && context['profile'] && context['profile']['profile_id'];
          const start_timestamp = context && context['profile'] && context['profile']['start_timestamp'];

          if (typeof profile_id !== 'string') {
            (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) &&
              utils$1.logger.log('[Profiling] cannot find profile for a transaction without a profile context');
            continue;
          }

          if (!profile_id) {
            (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) &&
              utils$1.logger.log('[Profiling] cannot find profile for a transaction without a profile context');
            continue;
          }

          // Remove the profile from the transaction context before sending, relay will take care of the rest.
          if (context && context['profile']) {
            delete context.profile;
          }

          const profile = utils.takeProfileFromGlobalCache(profile_id);
          if (!profile) {
            (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) && utils$1.logger.log(`[Profiling] Could not retrieve profile for transaction: ${profile_id}`);
            continue;
          }

          const profileEvent = utils.createProfilingEvent(
            profile_id,
            start_timestamp ,
            profile,
            profiledTransaction ,
          );
          if (profileEvent) {
            profilesToAddToEnvelope.push(profileEvent);
          }
        }

        utils.addProfilesToEnvelope(envelope, profilesToAddToEnvelope);
      });
    } else {
      utils$1.logger.warn('[Profiling] Client does not support hooks, profiling will be disabled');
    }
  }
} BrowserProfilingIntegration.__initStatic();

exports.BrowserProfilingIntegration = BrowserProfilingIntegration;
//# sourceMappingURL=integration.js.map
