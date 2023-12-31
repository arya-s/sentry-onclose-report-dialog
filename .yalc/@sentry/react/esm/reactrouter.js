import { WINDOW } from '@sentry/browser';
import hoistNonReactStatics from 'hoist-non-react-statics';
import * as React from 'react';

const _jsxFileName = "/home/user/dev/sentry-javascript/packages/react/src/reactrouter.tsx";
// We need to disable eslint no-explict-any because any is required for the
// react-router typings.

 // eslint-disable-line @typescript-eslint/no-explicit-any

let activeTransaction;

function reactRouterV4Instrumentation(
  history,
  routes,
  matchPath,
) {
  return createReactRouterInstrumentation(history, 'react-router-v4', routes, matchPath);
}

function reactRouterV5Instrumentation(
  history,
  routes,
  matchPath,
) {
  return createReactRouterInstrumentation(history, 'react-router-v5', routes, matchPath);
}

function createReactRouterInstrumentation(
  history,
  name,
  allRoutes = [],
  matchPath,
) {
  function getInitPathName() {
    if (history && history.location) {
      return history.location.pathname;
    }

    if (WINDOW && WINDOW.location) {
      return WINDOW.location.pathname;
    }

    return undefined;
  }

  /**
   * Normalizes a transaction name. Returns the new name as well as the
   * source of the transaction.
   *
   * @param pathname The initial pathname we normalize
   */
  function normalizeTransactionName(pathname) {
    if (allRoutes.length === 0 || !matchPath) {
      return [pathname, 'url'];
    }

    const branches = matchRoutes(allRoutes, pathname, matchPath);
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let x = 0; x < branches.length; x++) {
      if (branches[x].match.isExact) {
        return [branches[x].match.path, 'route'];
      }
    }

    return [pathname, 'url'];
  }

  const tags = {
    'routing.instrumentation': name,
  };

  return (customStartTransaction, startTransactionOnPageLoad = true, startTransactionOnLocationChange = true) => {
    const initPathName = getInitPathName();
    if (startTransactionOnPageLoad && initPathName) {
      const [name, source] = normalizeTransactionName(initPathName);
      activeTransaction = customStartTransaction({
        name,
        op: 'pageload',
        origin: 'auto.pageload.react.reactrouter',
        tags,
        metadata: {
          source,
        },
      });
    }

    if (startTransactionOnLocationChange && history.listen) {
      history.listen((location, action) => {
        if (action && (action === 'PUSH' || action === 'POP')) {
          if (activeTransaction) {
            activeTransaction.finish();
          }

          const [name, source] = normalizeTransactionName(location.pathname);
          activeTransaction = customStartTransaction({
            name,
            op: 'navigation',
            origin: 'auto.navigation.react.reactrouter',
            tags,
            metadata: {
              source,
            },
          });
        }
      });
    }
  };
}

/**
 * Matches a set of routes to a pathname
 * Based on implementation from
 */
function matchRoutes(
  routes,
  pathname,
  matchPath,
  branch = [],
) {
  routes.some(route => {
    const match = route.path
      ? matchPath(pathname, route)
      : branch.length
      ? branch[branch.length - 1].match // use parent match
      : computeRootMatch(pathname); // use default "root" match

    if (match) {
      branch.push({ route, match });

      if (route.routes) {
        matchRoutes(route.routes, pathname, matchPath, branch);
      }
    }

    return !!match;
  });

  return branch;
}

function computeRootMatch(pathname) {
  return { path: '/', url: '/', params: {}, isExact: pathname === '/' };
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
function withSentryRouting(Route) {
  const componentDisplayName = (Route ).displayName || (Route ).name;

  const WrappedRoute = (props) => {
    if (activeTransaction && props && props.computedMatch && props.computedMatch.isExact) {
      activeTransaction.setName(props.computedMatch.path, 'route');
    }

    // @ts-expect-error Setting more specific React Component typing for `R` generic above
    // will break advanced type inference done by react router params:
    // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/13dc4235c069e25fe7ee16e11f529d909f9f3ff8/types/react-router/index.d.ts#L154-L164
    return React.createElement(Route, { ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 174}} );
  };

  WrappedRoute.displayName = `sentryRoute(${componentDisplayName})`;
  hoistNonReactStatics(WrappedRoute, Route);
  // @ts-expect-error Setting more specific React Component typing for `R` generic above
  // will break advanced type inference done by react router params:
  // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/13dc4235c069e25fe7ee16e11f529d909f9f3ff8/types/react-router/index.d.ts#L154-L164
  return WrappedRoute;
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */

export { reactRouterV4Instrumentation, reactRouterV5Instrumentation, withSentryRouting };
//# sourceMappingURL=reactrouter.js.map
