import { addGlobalEventProcessor, configureScope, getCurrentHub } from '@sentry/browser';
import { addNonEnumerableProperty } from '@sentry/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACTION_BREADCRUMB_CATEGORY = 'redux.action';
const ACTION_BREADCRUMB_TYPE = 'info';

const defaultOptions = {
  attachReduxState: true,
  actionTransformer: action => action,
  stateTransformer: state => state || null,
};

/**
 * Creates an enhancer that would be passed to Redux's createStore to log actions and the latest state to Sentry.
 *
 * @param enhancerOptions Options to pass to the enhancer
 */
function createReduxEnhancer(enhancerOptions) {
  // Note: We return an any type as to not have type conflicts.
  const options = {
    ...defaultOptions,
    ...enhancerOptions,
  };

  return (next) =>
    (reducer, initialState) => {
      options.attachReduxState &&
        addGlobalEventProcessor((event, hint) => {
          try {
            // @ts-expect-error try catch to reduce bundle size
            if (event.type === undefined && event.contexts.state.state.type === 'redux') {
              hint.attachments = [
                ...(hint.attachments || []),
                // @ts-expect-error try catch to reduce bundle size
                { filename: 'redux_state.json', data: JSON.stringify(event.contexts.state.state.value) },
              ];
            }
          } catch (_) {
            // empty
          }
          return event;
        });

      const sentryReducer = (state, action) => {
        const newState = reducer(state, action);

        configureScope(scope => {
          /* Action breadcrumbs */
          const transformedAction = options.actionTransformer(action);
          if (typeof transformedAction !== 'undefined' && transformedAction !== null) {
            scope.addBreadcrumb({
              category: ACTION_BREADCRUMB_CATEGORY,
              data: transformedAction,
              type: ACTION_BREADCRUMB_TYPE,
            });
          }

          /* Set latest state to scope */
          const transformedState = options.stateTransformer(newState);
          if (typeof transformedState !== 'undefined' && transformedState !== null) {
            const client = getCurrentHub().getClient();
            const options = client && client.getOptions();
            const normalizationDepth = (options && options.normalizeDepth) || 3; // default state normalization depth to 3

            // Set the normalization depth of the redux state to the configured `normalizeDepth` option or a sane number as a fallback
            const newStateContext = { state: { type: 'redux', value: transformedState } };
            addNonEnumerableProperty(
              newStateContext,
              '__sentry_override_normalization_depth__',
              3 + // 3 layers for `state.value.transformedState`
                normalizationDepth, // rest for the actual state
            );

            scope.setContext('state', newStateContext);
          } else {
            scope.setContext('state', null);
          }

          /* Allow user to configure scope with latest state */
          const { configureScopeWithState } = options;
          if (typeof configureScopeWithState === 'function') {
            configureScopeWithState(scope, newState);
          }
        });

        return newState;
      };

      return next(sentryReducer, initialState);
    };
}

export { createReduxEnhancer };
//# sourceMappingURL=redux.js.map
