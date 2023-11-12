import { _optionalChain } from '@sentry/utils';
import { loadModule, logger, fill, isThenable } from '@sentry/utils';
import { shouldDisableAutoInstrumentation } from './utils/node-utils.js';

/** Tracing integration for graphql package */
class GraphQL  {
  /**
   * @inheritDoc
   */
   static __initStatic() {this.id = 'GraphQL';}

  /**
   * @inheritDoc
   */

   constructor() {
    this.name = GraphQL.id;
  }

  /** @inheritdoc */
   loadDependency() {
    return (this._module = this._module || loadModule('graphql/execution/execute.js'));
  }

  /**
   * @inheritDoc
   */
   setupOnce(_, getCurrentHub) {
    if (shouldDisableAutoInstrumentation(getCurrentHub)) {
      (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) && logger.log('GraphQL Integration is skipped because of instrumenter configuration.');
      return;
    }

    const pkg = this.loadDependency();

    if (!pkg) {
      (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) && logger.error('GraphQL Integration was unable to require graphql/execution package.');
      return;
    }

    fill(pkg, 'execute', function (orig) {
      return function ( ...args) {
        const scope = getCurrentHub().getScope();
        const parentSpan = scope.getSpan();

        const span = _optionalChain([parentSpan, 'optionalAccess', _2 => _2.startChild, 'call', _3 => _3({
          description: 'execute',
          op: 'graphql.execute',
          origin: 'auto.graphql.graphql',
        })]);

        _optionalChain([scope, 'optionalAccess', _4 => _4.setSpan, 'call', _5 => _5(span)]);

        const rv = orig.call(this, ...args);

        if (isThenable(rv)) {
          return rv.then((res) => {
            _optionalChain([span, 'optionalAccess', _6 => _6.finish, 'call', _7 => _7()]);
            _optionalChain([scope, 'optionalAccess', _8 => _8.setSpan, 'call', _9 => _9(parentSpan)]);

            return res;
          });
        }

        _optionalChain([span, 'optionalAccess', _10 => _10.finish, 'call', _11 => _11()]);
        _optionalChain([scope, 'optionalAccess', _12 => _12.setSpan, 'call', _13 => _13(parentSpan)]);
        return rv;
      };
    });
  }
}GraphQL.__initStatic();

export { GraphQL };
//# sourceMappingURL=graphql.js.map
