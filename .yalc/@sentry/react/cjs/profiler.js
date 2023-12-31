Object.defineProperty(exports, '__esModule', { value: true });

const browser = require('@sentry/browser');
const utils = require('@sentry/utils');
const hoistNonReactStatics = require('hoist-non-react-statics');
const React = require('react');
const constants = require('./constants.js');

const _interopDefault = e => e && e.__esModule ? e.default : e;

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  const n = Object.create(null);
  if (e) {
    for (const k in e) {
      n[k] = e[k];
    }
  }
  n.default = e;
  return n;
}

const hoistNonReactStatics__default = /*#__PURE__*/_interopDefault(hoistNonReactStatics);
const React__namespace = /*#__PURE__*/_interopNamespace(React);

const _jsxFileName = "/home/user/dev/sentry-javascript/packages/react/src/profiler.tsx";

const UNKNOWN_COMPONENT = 'unknown';

/**
 * The Profiler component leverages Sentry's Tracing integration to generate
 * spans based on component lifecycles.
 */
class Profiler extends React__namespace.Component {
  /**
   * The span of the mount activity
   * Made protected for the React Native SDK to access
   */

  /**
   * The span that represents the duration of time between shouldComponentUpdate and componentDidUpdate
   */

  // eslint-disable-next-line @typescript-eslint/member-ordering
   static __initStatic() {this.defaultProps = {
    disabled: false,
    includeRender: true,
    includeUpdates: true,
  };}

   constructor(props) {
    super(props);
    const { name, disabled = false } = this.props;

    if (disabled) {
      return;
    }

    const activeTransaction = getActiveTransaction();
    if (activeTransaction) {
      this._mountSpan = activeTransaction.startChild({
        description: `<${name}>`,
        op: constants.REACT_MOUNT_OP,
        origin: 'auto.ui.react.profiler',
      });
    }
  }

  // If a component mounted, we can finish the mount activity.
   componentDidMount() {
    if (this._mountSpan) {
      this._mountSpan.finish();
    }
  }

   shouldComponentUpdate({ updateProps, includeUpdates = true }) {
    // Only generate an update span if includeUpdates is true, if there is a valid mountSpan,
    // and if the updateProps have changed. It is ok to not do a deep equality check here as it is expensive.
    // We are just trying to give baseline clues for further investigation.
    if (includeUpdates && this._mountSpan && updateProps !== this.props.updateProps) {
      // See what props haved changed between the previous props, and the current props. This is
      // set as data on the span. We just store the prop keys as the values could be potenially very large.
      const changedProps = Object.keys(updateProps).filter(k => updateProps[k] !== this.props.updateProps[k]);
      if (changedProps.length > 0) {
        const now = utils.timestampInSeconds();
        this._updateSpan = this._mountSpan.startChild({
          data: {
            changedProps,
          },
          description: `<${this.props.name}>`,
          op: constants.REACT_UPDATE_OP,
          origin: 'auto.ui.react.profiler',
          startTimestamp: now,
        });
      }
    }

    return true;
  }

   componentDidUpdate() {
    if (this._updateSpan) {
      this._updateSpan.finish();
      this._updateSpan = undefined;
    }
  }

  // If a component is unmounted, we can say it is no longer on the screen.
  // This means we can finish the span representing the component render.
   componentWillUnmount() {
    const { name, includeRender = true } = this.props;

    if (this._mountSpan && includeRender) {
      // If we were able to obtain the spanId of the mount activity, we should set the
      // next activity as a child to the component mount activity.
      this._mountSpan.startChild({
        description: `<${name}>`,
        endTimestamp: utils.timestampInSeconds(),
        op: constants.REACT_RENDER_OP,
        origin: 'auto.ui.react.profiler',
        startTimestamp: this._mountSpan.endTimestamp,
      });
    }
  }

   render() {
    return this.props.children;
  }
} Profiler.__initStatic();

/**
 * withProfiler is a higher order component that wraps a
 * component in a {@link Profiler} component. It is recommended that
 * the higher order component be used over the regular {@link Profiler} component.
 *
 * @param WrappedComponent component that is wrapped by Profiler
 * @param options the {@link ProfilerProps} you can pass into the Profiler
 */
function withProfiler(
  WrappedComponent,
  // We do not want to have `updateProps` given in options, it is instead filled through the HOC.
  options,
) {
  const componentDisplayName =
    (options && options.name) || WrappedComponent.displayName || WrappedComponent.name || UNKNOWN_COMPONENT;

  const Wrapped = (props) => (
    React__namespace.createElement(Profiler, { ...options, name: componentDisplayName, updateProps: props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 149}}
      , React__namespace.createElement(WrappedComponent, { ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 150}} )
    )
  );

  Wrapped.displayName = `profiler(${componentDisplayName})`;

  // Copy over static methods from Wrapped component to Profiler HOC
  // See: https://reactjs.org/docs/higher-order-components.html#static-methods-must-be-copied-over
  hoistNonReactStatics__default(Wrapped, WrappedComponent);
  return Wrapped;
}

/**
 *
 * `useProfiler` is a React hook that profiles a React component.
 *
 * Requires React 16.8 or above.
 * @param name displayName of component being profiled
 */
function useProfiler(
  name,
  options = {
    disabled: false,
    hasRenderSpan: true,
  },
) {
  const [mountSpan] = React__namespace.useState(() => {
    if (options && options.disabled) {
      return undefined;
    }

    const activeTransaction = getActiveTransaction();
    if (activeTransaction) {
      return activeTransaction.startChild({
        description: `<${name}>`,
        op: constants.REACT_MOUNT_OP,
        origin: 'auto.ui.react.profiler',
      });
    }

    return undefined;
  });

  React__namespace.useEffect(() => {
    if (mountSpan) {
      mountSpan.finish();
    }

    return () => {
      if (mountSpan && options.hasRenderSpan) {
        mountSpan.startChild({
          description: `<${name}>`,
          endTimestamp: utils.timestampInSeconds(),
          op: constants.REACT_RENDER_OP,
          origin: 'auto.ui.react.profiler',
          startTimestamp: mountSpan.endTimestamp,
        });
      }
    };
    // We only want this to run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Grabs active transaction off scope */
function getActiveTransaction(hub = browser.getCurrentHub()) {
  if (hub) {
    const scope = hub.getScope();
    return scope.getTransaction() ;
  }

  return undefined;
}

exports.Profiler = Profiler;
exports.UNKNOWN_COMPONENT = UNKNOWN_COMPONENT;
exports.getActiveTransaction = getActiveTransaction;
exports.useProfiler = useProfiler;
exports.withProfiler = withProfiler;
//# sourceMappingURL=profiler.js.map
