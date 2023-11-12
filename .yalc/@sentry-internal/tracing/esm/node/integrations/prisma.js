import { trace, getCurrentHub } from '@sentry/core';
import { addNonEnumerableProperty, logger } from '@sentry/utils';
import { shouldDisableAutoInstrumentation } from './utils/node-utils.js';

function isValidPrismaClient(possibleClient) {
  return !!possibleClient && !!(possibleClient )['$use'];
}

/** Tracing integration for @prisma/client package */
class Prisma  {
  /**
   * @inheritDoc
   */
   static __initStatic() {this.id = 'Prisma';}

  /**
   * @inheritDoc
   */

  /**
   * @inheritDoc
   */
   constructor(options = {}) {
    this.name = Prisma.id;

    // We instrument the PrismaClient inside the constructor and not inside `setupOnce` because in some cases of server-side
    // bundling (Next.js) multiple Prisma clients can be instantiated, even though users don't intend to. When instrumenting
    // in setupOnce we can only ever instrument one client.
    // https://github.com/getsentry/sentry-javascript/issues/7216#issuecomment-1602375012
    // In the future we might explore providing a dedicated PrismaClient middleware instead of this hack.
    if (isValidPrismaClient(options.client) && !options.client._sentryInstrumented) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addNonEnumerableProperty(options.client , '_sentryInstrumented', true);

      const clientData = {};
      try {
        const engineConfig = (options.client )._engineConfig;
        if (engineConfig) {
          const { activeProvider, clientVersion } = engineConfig;
          if (activeProvider) {
            clientData['db.system'] = activeProvider;
          }
          if (clientVersion) {
            clientData['db.prisma.version'] = clientVersion;
          }
        }
      } catch (e) {
        // ignore
      }

      options.client.$use((params, next) => {
        if (shouldDisableAutoInstrumentation(getCurrentHub)) {
          return next(params);
        }

        const action = params.action;
        const model = params.model;

        return trace(
          {
            name: model ? `${model} ${action}` : action,
            op: 'db.sql.prisma',
            origin: 'auto.db.prisma',
            data: { ...clientData, 'db.operation': action },
          },
          () => next(params),
        );
      });
    } else {
      (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) &&
        logger.warn('Unsupported Prisma client provided to PrismaIntegration. Provided client:', options.client);
    }
  }

  /**
   * @inheritDoc
   */
   setupOnce() {
    // Noop - here for backwards compatibility
  }
} Prisma.__initStatic();

export { Prisma };
//# sourceMappingURL=prisma.js.map
