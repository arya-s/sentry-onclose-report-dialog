import { WINDOW } from '@sentry/browser';
import { logger, getNumberOfUrlSegments } from '@sentry/utils';
import hoistNonReactStatics from 'hoist-non-react-statics';
import * as React from 'react';

const _jsxFileName = "/home/user/dev/sentry-javascript/packages/react/src/reactrouterv6.tsx";// Inspired from Donnie McNeal's solution:

let activeTransaction;

let _useEffect;
let _useLocation;
let _useNavigationType;
let _createRoutesFromChildren;
let _matchRoutes;
let _customStartTransaction;
let _startTransactionOnLocationChange;

const SENTRY_TAGS = {
  'routing.instrumentation': 'react-router-v6',
};

function reactRouterV6Instrumentation(
  useEffect,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
) {
  return (
    customStartTransaction,
    startTransactionOnPageLoad = true,
    startTransactionOnLocationChange = true,
  ) => {
    const initPathName = WINDOW && WINDOW.location && WINDOW.location.pathname;
    if (startTransactionOnPageLoad && initPathName) {
      activeTransaction = customStartTransaction({
        name: initPathName,
        op: 'pageload',
        origin: 'auto.pageload.react.reactrouterv6',
        tags: SENTRY_TAGS,
        metadata: {
          source: 'url',
        },
      });
    }

    _useEffect = useEffect;
    _useLocation = useLocation;
    _useNavigationType = useNavigationType;
    _matchRoutes = matchRoutes;
    _createRoutesFromChildren = createRoutesFromChildren;

    _customStartTransaction = customStartTransaction;
    _startTransactionOnLocationChange = startTransactionOnLocationChange;
  };
}

function getNormalizedName(
  routes,
  location,
  branches,
  basename = '',
) {
  if (!routes || routes.length === 0) {
    return [location.pathname, 'url'];
  }

  let pathBuilder = '';
  if (branches) {
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let x = 0; x < branches.length; x++) {
      const branch = branches[x];
      const route = branch.route;
      if (route) {
        // Early return if index route
        if (route.index) {
          return [branch.pathname, 'route'];
        }

        const path = route.path;
        if (path) {
          const newPath = path[0] === '/' || pathBuilder[pathBuilder.length - 1] === '/' ? path : `/${path}`;
          pathBuilder += newPath;

          if (basename + branch.pathname === location.pathname) {
            if (
              // If the route defined on the element is something like
              // <Route path="/stores/:storeId/products/:productId" element={<div>Product</div>} />
              // We should check against the branch.pathname for the number of / seperators
              getNumberOfUrlSegments(pathBuilder) !== getNumberOfUrlSegments(branch.pathname) &&
              // We should not count wildcard operators in the url segments calculation
              pathBuilder.slice(-2) !== '/*'
            ) {
              return [basename + newPath, 'route'];
            }
            return [basename + pathBuilder, 'route'];
          }
        }
      }
    }
  }

  return [location.pathname, 'url'];
}

function updatePageloadTransaction(
  location,
  routes,
  matches,
  basename,
) {
  const branches = Array.isArray(matches)
    ? matches
    : (_matchRoutes(routes, location, basename) );

  if (activeTransaction && branches) {
    activeTransaction.setName(...getNormalizedName(routes, location, branches, basename));
  }
}

function handleNavigation(
  location,
  routes,
  navigationType,
  matches,
  basename,
) {
  const branches = Array.isArray(matches) ? matches : _matchRoutes(routes, location, basename);

  if (_startTransactionOnLocationChange && (navigationType === 'PUSH' || navigationType === 'POP') && branches) {
    if (activeTransaction) {
      activeTransaction.finish();
    }

    const [name, source] = getNormalizedName(routes, location, branches, basename);
    activeTransaction = _customStartTransaction({
      name,
      op: 'navigation',
      origin: 'auto.navigation.react.reactrouterv6',
      tags: SENTRY_TAGS,
      metadata: {
        source,
      },
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withSentryReactRouterV6Routing(Routes) {
  if (
    !_useEffect ||
    !_useLocation ||
    !_useNavigationType ||
    !_createRoutesFromChildren ||
    !_matchRoutes ||
    !_customStartTransaction
  ) {
    (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) &&
      logger.warn(`reactRouterV6Instrumentation was unable to wrap Routes because of one or more missing parameters.
      useEffect: ${_useEffect}. useLocation: ${_useLocation}. useNavigationType: ${_useNavigationType}.
      createRoutesFromChildren: ${_createRoutesFromChildren}. matchRoutes: ${_matchRoutes}. customStartTransaction: ${_customStartTransaction}.`);

    return Routes;
  }

  let isMountRenderPass = true;

  const SentryRoutes = (props) => {
    const location = _useLocation();
    const navigationType = _useNavigationType();

    _useEffect(
      () => {
        const routes = _createRoutesFromChildren(props.children) ;

        if (isMountRenderPass) {
          updatePageloadTransaction(location, routes);
          isMountRenderPass = false;
        } else {
          handleNavigation(location, routes, navigationType);
        }
      },
      // `props.children` is purpusely not included in the dependency array, because we do not want to re-run this effect
      // when the children change. We only want to start transactions when the location or navigation type change.
      [location, navigationType],
    );

    // @ts-expect-error Setting more specific React Component typing for `R` generic above
    // will break advanced type inference done by react router params
    return React.createElement(Routes, { ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 209}} );
  };

  hoistNonReactStatics(SentryRoutes, Routes);

  // @ts-expect-error Setting more specific React Component typing for `R` generic above
  // will break advanced type inference done by react router params
  return SentryRoutes;
}

function wrapUseRoutes(origUseRoutes) {
  if (!_useEffect || !_useLocation || !_useNavigationType || !_matchRoutes || !_customStartTransaction) {
    (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) &&
      logger.warn(
        'reactRouterV6Instrumentation was unable to wrap `useRoutes` because of one or more missing parameters.',
      );

    return origUseRoutes;
  }

  let isMountRenderPass = true;

  const SentryRoutes

 = (props) => {
    const { routes, locationArg } = props;

    const Routes = origUseRoutes(routes, locationArg);

    const location = _useLocation();
    const navigationType = _useNavigationType();

    // A value with stable identity to either pick `locationArg` if available or `location` if not
    const stableLocationParam =
      typeof locationArg === 'string' || (locationArg && locationArg.pathname)
        ? (locationArg )
        : location;

    _useEffect(() => {
      const normalizedLocation =
        typeof stableLocationParam === 'string' ? { pathname: stableLocationParam } : stableLocationParam;

      if (isMountRenderPass) {
        updatePageloadTransaction(normalizedLocation, routes);
        isMountRenderPass = false;
      } else {
        handleNavigation(normalizedLocation, routes, navigationType);
      }
    }, [navigationType, stableLocationParam]);

    return Routes;
  };

  // eslint-disable-next-line react/display-name
  return (routes, locationArg) => {
    return React.createElement(SentryRoutes, { routes: routes, locationArg: locationArg, __self: this, __source: {fileName: _jsxFileName, lineNumber: 266}} );
  };
}

function wrapCreateBrowserRouter

(createRouterFunction) {
  // `opts` for createBrowserHistory and createMemoryHistory are different, but also not relevant for us at the moment.
  // `basename` is the only option that is relevant for us, and it is the same for all.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (routes, opts) {
    const router = createRouterFunction(routes, opts);
    const basename = opts && opts.basename;

    // The initial load ends when `createBrowserRouter` is called.
    // This is the earliest convenient time to update the transaction name.
    // Callbacks to `router.subscribe` are not called for the initial load.
    if (router.state.historyAction === 'POP' && activeTransaction) {
      updatePageloadTransaction(router.state.location, routes, undefined, basename);
    }

    router.subscribe((state) => {
      const location = state.location;

      if (
        _startTransactionOnLocationChange &&
        (state.historyAction === 'PUSH' || state.historyAction === 'POP') &&
        activeTransaction
      ) {
        handleNavigation(location, routes, state.historyAction, undefined, basename);
      }
    });

    return router;
  };
}

export { reactRouterV6Instrumentation, withSentryReactRouterV6Routing, wrapCreateBrowserRouter, wrapUseRoutes };
//# sourceMappingURL=reactrouterv6.js.map
