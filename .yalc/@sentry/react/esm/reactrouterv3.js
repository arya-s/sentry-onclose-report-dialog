import { WINDOW } from '@sentry/browser';

// Many of the types below had to be mocked out to prevent typescript issues
// these types are required for correct functionality.

/**
 * Creates routing instrumentation for React Router v3
 * Works for React Router >= 3.2.0 and < 4.0.0
 *
 * @param history object from the `history` library
 * @param routes a list of all routes, should be
 * @param match `Router.match` utility
 */
function reactRouterV3Instrumentation(
  history,
  routes,
  match,
) {
  return (
    startTransaction,
    startTransactionOnPageLoad = true,
    startTransactionOnLocationChange = true,
  ) => {
    let activeTransaction;
    let prevName;

    // Have to use window.location because history.location might not be defined.
    if (startTransactionOnPageLoad && WINDOW && WINDOW.location) {
      normalizeTransactionName(
        routes,
        WINDOW.location ,
        match,
        (localName, source = 'url') => {
          prevName = localName;
          activeTransaction = startTransaction({
            name: prevName,
            op: 'pageload',
            origin: 'auto.pageload.react.reactrouterv3',
            tags: {
              'routing.instrumentation': 'react-router-v3',
            },
            metadata: {
              source,
            },
          });
        },
      );
    }

    if (startTransactionOnLocationChange && history.listen) {
      history.listen(location => {
        if (location.action === 'PUSH' || location.action === 'POP') {
          if (activeTransaction) {
            activeTransaction.finish();
          }
          const tags = {
            'routing.instrumentation': 'react-router-v3',
          };
          if (prevName) {
            tags.from = prevName;
          }
          normalizeTransactionName(routes, location, match, (localName, source = 'url') => {
            prevName = localName;
            activeTransaction = startTransaction({
              name: prevName,
              op: 'navigation',
              origin: 'auto.navigation.react.reactrouterv3',
              tags,
              metadata: {
                source,
              },
            });
          });
        }
      });
    }
  };
}

/**
 * Normalize transaction names using `Router.match`
 */
function normalizeTransactionName(
  appRoutes,
  location,
  match,
  callback,
) {
  let name = location.pathname;
  match(
    {
      location,
      routes: appRoutes,
    },
    (error, _redirectLocation, renderProps) => {
      if (error || !renderProps) {
        return callback(name);
      }

      const routePath = getRouteStringFromRoutes(renderProps.routes || []);
      if (routePath.length === 0 || routePath === '/*') {
        return callback(name);
      }

      name = routePath;
      return callback(name, 'route');
    },
  );
}

/**
 * Generate route name from array of routes
 */
function getRouteStringFromRoutes(routes) {
  if (!Array.isArray(routes) || routes.length === 0) {
    return '';
  }

  const routesWithPaths = routes.filter((route) => !!route.path);

  let index = -1;
  for (let x = routesWithPaths.length - 1; x >= 0; x--) {
    const route = routesWithPaths[x];
    if (route.path && route.path.startsWith('/')) {
      index = x;
      break;
    }
  }

  return routesWithPaths
    .slice(index)
    .filter(({ path }) => !!path)
    .map(({ path }) => path)
    .join('');
}

export { reactRouterV3Instrumentation };
//# sourceMappingURL=reactrouterv3.js.map
