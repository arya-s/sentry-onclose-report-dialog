Object.defineProperty(exports, '__esModule', { value: true });

const utils = require('@sentry/utils');
const eventbuilder = require('../eventbuilder.js');

const DEFAULT_KEY = 'cause';
const DEFAULT_LIMIT = 5;

/** Adds SDK info to an event. */
class LinkedErrors  {
  /**
   * @inheritDoc
   */
   static __initStatic() {this.id = 'LinkedErrors';}

  /**
   * @inheritDoc
   */

  /**
   * @inheritDoc
   */

  /**
   * @inheritDoc
   */

  /**
   * @inheritDoc
   */
   constructor(options = {}) {
    this.name = LinkedErrors.id;
    this._key = options.key || DEFAULT_KEY;
    this._limit = options.limit || DEFAULT_LIMIT;
  }

  /** @inheritdoc */
   setupOnce() {
    // noop
  }

  /**
   * @inheritDoc
   */
   preprocessEvent(event, hint, client) {
    const options = client.getOptions();

    utils.applyAggregateErrorsToEvent(
      eventbuilder.exceptionFromError,
      options.stackParser,
      options.maxValueLength,
      this._key,
      this._limit,
      event,
      hint,
    );
  }
} LinkedErrors.__initStatic();

exports.LinkedErrors = LinkedErrors;
//# sourceMappingURL=linkederrors.js.map
