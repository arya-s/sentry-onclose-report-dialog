import { _optionalChain } from '@sentry/utils';
import { loadModule, logger, fill, isThenable } from '@sentry/utils';
import { shouldDisableAutoInstrumentation } from './utils/node-utils.js';

// This allows us to use the same array for both defaults options and the type itself.
// (note `as const` at the end to make it a union of string literal types (i.e. "a" | "b" | ... )
// and not just a string[])

const OPERATIONS = [
  'aggregate', // aggregate(pipeline, options, callback)
  'bulkWrite', // bulkWrite(operations, options, callback)
  'countDocuments', // countDocuments(query, options, callback)
  'createIndex', // createIndex(fieldOrSpec, options, callback)
  'createIndexes', // createIndexes(indexSpecs, options, callback)
  'deleteMany', // deleteMany(filter, options, callback)
  'deleteOne', // deleteOne(filter, options, callback)
  'distinct', // distinct(key, query, options, callback)
  'drop', // drop(options, callback)
  'dropIndex', // dropIndex(indexName, options, callback)
  'dropIndexes', // dropIndexes(options, callback)
  'estimatedDocumentCount', // estimatedDocumentCount(options, callback)
  'find', // find(query, options, callback)
  'findOne', // findOne(query, options, callback)
  'findOneAndDelete', // findOneAndDelete(filter, options, callback)
  'findOneAndReplace', // findOneAndReplace(filter, replacement, options, callback)
  'findOneAndUpdate', // findOneAndUpdate(filter, update, options, callback)
  'indexes', // indexes(options, callback)
  'indexExists', // indexExists(indexes, options, callback)
  'indexInformation', // indexInformation(options, callback)
  'initializeOrderedBulkOp', // initializeOrderedBulkOp(options, callback)
  'insertMany', // insertMany(docs, options, callback)
  'insertOne', // insertOne(doc, options, callback)
  'isCapped', // isCapped(options, callback)
  'mapReduce', // mapReduce(map, reduce, options, callback)
  'options', // options(options, callback)
  'parallelCollectionScan', // parallelCollectionScan(options, callback)
  'rename', // rename(newName, options, callback)
  'replaceOne', // replaceOne(filter, doc, options, callback)
  'stats', // stats(options, callback)
  'updateMany', // updateMany(filter, update, options, callback)
  'updateOne', // updateOne(filter, update, options, callback)
] ;

// All of the operations above take `options` and `callback` as their final parameters, but some of them
// take additional parameters as well. For those operations, this is a map of
// { <operation name>:  [<names of additional parameters>] }, as a way to know what to call the operation's
// positional arguments when we add them to the span's `data` object later
const OPERATION_SIGNATURES

 = {
  // aggregate intentionally not included because `pipeline` arguments are too complex to serialize well
  // see https://github.com/getsentry/sentry-javascript/pull/3102
  bulkWrite: ['operations'],
  countDocuments: ['query'],
  createIndex: ['fieldOrSpec'],
  createIndexes: ['indexSpecs'],
  deleteMany: ['filter'],
  deleteOne: ['filter'],
  distinct: ['key', 'query'],
  dropIndex: ['indexName'],
  find: ['query'],
  findOne: ['query'],
  findOneAndDelete: ['filter'],
  findOneAndReplace: ['filter', 'replacement'],
  findOneAndUpdate: ['filter', 'update'],
  indexExists: ['indexes'],
  insertMany: ['docs'],
  insertOne: ['doc'],
  mapReduce: ['map', 'reduce'],
  rename: ['newName'],
  replaceOne: ['filter', 'doc'],
  updateMany: ['filter', 'update'],
  updateOne: ['filter', 'update'],
};

function isCursor(maybeCursor) {
  return maybeCursor && typeof maybeCursor === 'object' && maybeCursor.once && typeof maybeCursor.once === 'function';
}

/** Tracing integration for mongo package */
class Mongo  {
  /**
   * @inheritDoc
   */
   static __initStatic() {this.id = 'Mongo';}

  /**
   * @inheritDoc
   */

  /**
   * @inheritDoc
   */
   constructor(options = {}) {
    this.name = Mongo.id;
    this._operations = Array.isArray(options.operations) ? options.operations : (OPERATIONS );
    this._describeOperations = 'describeOperations' in options ? options.describeOperations : true;
    this._useMongoose = !!options.useMongoose;
  }

  /** @inheritdoc */
   loadDependency() {
    const moduleName = this._useMongoose ? 'mongoose' : 'mongodb';
    return (this._module = this._module || loadModule(moduleName));
  }

  /**
   * @inheritDoc
   */
   setupOnce(_, getCurrentHub) {
    if (shouldDisableAutoInstrumentation(getCurrentHub)) {
      (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) && logger.log('Mongo Integration is skipped because of instrumenter configuration.');
      return;
    }

    const pkg = this.loadDependency();

    if (!pkg) {
      const moduleName = this._useMongoose ? 'mongoose' : 'mongodb';
      (typeof __SENTRY_DEBUG__ === 'undefined' || __SENTRY_DEBUG__) && logger.error(`Mongo Integration was unable to require \`${moduleName}\` package.`);
      return;
    }

    this._instrumentOperations(pkg.Collection, this._operations, getCurrentHub);
  }

  /**
   * Patches original collection methods
   */
   _instrumentOperations(collection, operations, getCurrentHub) {
    operations.forEach((operation) => this._patchOperation(collection, operation, getCurrentHub));
  }

  /**
   * Patches original collection to utilize our tracing functionality
   */
   _patchOperation(collection, operation, getCurrentHub) {
    if (!(operation in collection.prototype)) return;

    const getSpanContext = this._getSpanContextFromOperationArguments.bind(this);

    fill(collection.prototype, operation, function (orig) {
      return function ( ...args) {
        const lastArg = args[args.length - 1];
        const scope = getCurrentHub().getScope();
        const parentSpan = scope.getSpan();

        // Check if the operation was passed a callback. (mapReduce requires a different check, as
        // its (non-callback) arguments can also be functions.)
        if (typeof lastArg !== 'function' || (operation === 'mapReduce' && args.length === 2)) {
          const span = _optionalChain([parentSpan, 'optionalAccess', _2 => _2.startChild, 'call', _3 => _3(getSpanContext(this, operation, args))]);
          const maybePromiseOrCursor = orig.call(this, ...args);

          if (isThenable(maybePromiseOrCursor)) {
            return maybePromiseOrCursor.then((res) => {
              _optionalChain([span, 'optionalAccess', _4 => _4.finish, 'call', _5 => _5()]);
              return res;
            });
          }
          // If the operation returns a Cursor
          // we need to attach a listener to it to finish the span when the cursor is closed.
          else if (isCursor(maybePromiseOrCursor)) {
            const cursor = maybePromiseOrCursor ;

            try {
              cursor.once('close', () => {
                _optionalChain([span, 'optionalAccess', _6 => _6.finish, 'call', _7 => _7()]);
              });
            } catch (e) {
              // If the cursor is already closed, `once` will throw an error. In that case, we can
              // finish the span immediately.
              _optionalChain([span, 'optionalAccess', _8 => _8.finish, 'call', _9 => _9()]);
            }

            return cursor;
          } else {
            _optionalChain([span, 'optionalAccess', _10 => _10.finish, 'call', _11 => _11()]);
            return maybePromiseOrCursor;
          }
        }

        const span = _optionalChain([parentSpan, 'optionalAccess', _12 => _12.startChild, 'call', _13 => _13(getSpanContext(this, operation, args.slice(0, -1)))]);

        return orig.call(this, ...args.slice(0, -1), function (err, result) {
          _optionalChain([span, 'optionalAccess', _14 => _14.finish, 'call', _15 => _15()]);
          lastArg(err, result);
        });
      };
    });
  }

  /**
   * Form a SpanContext based on the user input to a given operation.
   */
   _getSpanContextFromOperationArguments(
    collection,
    operation,
    args,
  ) {
    const data = {
      'db.system': 'mongodb',
      'db.name': collection.dbName,
      'db.operation': operation,
      'db.mongodb.collection': collection.collectionName,
    };
    const spanContext = {
      op: 'db',
      // TODO v8: Use `${collection.collectionName}.${operation}`
      origin: 'auto.db.mongo',
      description: operation,
      data,
    };

    // If the operation takes no arguments besides `options` and `callback`, or if argument
    // collection is disabled for this operation, just return early.
    const signature = OPERATION_SIGNATURES[operation];
    const shouldDescribe = Array.isArray(this._describeOperations)
      ? this._describeOperations.includes(operation)
      : this._describeOperations;

    if (!signature || !shouldDescribe) {
      return spanContext;
    }

    try {
      // Special case for `mapReduce`, as the only one accepting functions as arguments.
      if (operation === 'mapReduce') {
        const [map, reduce] = args ;
        data[signature[0]] = typeof map === 'string' ? map : map.name || '<anonymous>';
        data[signature[1]] = typeof reduce === 'string' ? reduce : reduce.name || '<anonymous>';
      } else {
        for (let i = 0; i < signature.length; i++) {
          data[`db.mongodb.${signature[i]}`] = JSON.stringify(args[i]);
        }
      }
    } catch (_oO) {
      // no-empty
    }

    return spanContext;
  }
}Mongo.__initStatic();

export { Mongo };
//# sourceMappingURL=mongo.js.map