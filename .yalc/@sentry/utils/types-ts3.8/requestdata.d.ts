/**
 * The functions here, which enrich an event with request data, are mostly for use in Node, but are safe for use in a
 * browser context. They live here in `@sentry/utils` rather than in `@sentry/node` so that they can be used in
 * frameworks (like nextjs), which, because of SSR, run the same code in both Node and browser contexts.
 *
 * TODO (v8 / #5257): Remove the note below
 * Note that for now, the tests for this code have to live in `@sentry/node`, since they test both these functions and
 * the backwards-compatibility-preserving wrappers which still live in `handlers.ts` there.
 */
import { Event, ExtractedNodeRequestData, PolymorphicRequest, Transaction, TransactionSource } from '@sentry/types';
type InjectedNodeDeps = {
    cookie: {
        parse: (cookieStr: string) => Record<string, string>;
    };
    url: {
        parse: (urlStr: string) => {
            query: string | null;
        };
    };
};
/**
 * Sets parameterized route as transaction name e.g.: `GET /users/:id`
 * Also adds more context data on the transaction from the request
 */
export declare function addRequestDataToTransaction(transaction: Transaction | undefined, req: PolymorphicRequest, deps?: InjectedNodeDeps): void;
/**
 * Extracts a complete and parameterized path from the request object and uses it to construct transaction name.
 * If the parameterized transaction name cannot be extracted, we fall back to the raw URL.
 *
 * Additionally, this function determines and returns the transaction name source
 *
 * eg. GET /mountpoint/user/:id
 *
 * @param req A request object
 * @param options What to include in the transaction name (method, path, or a custom route name to be
 *                used instead of the request's route)
 *
 * @returns A tuple of the fully constructed transaction name [0] and its source [1] (can be either 'route' or 'url')
 */
export declare function extractPathForTransaction(req: PolymorphicRequest, options?: {
    path?: boolean;
    method?: boolean;
    customRoute?: string;
}): [
    string,
    TransactionSource
];
type TransactionNamingScheme = 'path' | 'methodPath' | 'handler';
/**
 * Normalize data from the request object, accounting for framework differences.
 *
 * @param req The request object from which to extract data
 * @param options.include An optional array of keys to include in the normalized data. Defaults to
 * DEFAULT_REQUEST_INCLUDES if not provided.
 * @param options.deps Injected, platform-specific dependencies
 * @returns An object containing normalized request data
 */
export declare function extractRequestData(req: PolymorphicRequest, options?: {
    include?: string[];
    deps?: InjectedNodeDeps;
}): ExtractedNodeRequestData;
/**
 * Options deciding what parts of the request to use when enhancing an event
 */
export interface AddRequestDataToEventOptions {
    /** Flags controlling whether each type of data should be added to the event */
    include?: {
        ip?: boolean;
        request?: boolean | string[];
        transaction?: boolean | TransactionNamingScheme;
        user?: boolean | string[];
    };
    /** Injected platform-specific dependencies */
    deps?: {
        cookie: {
            parse: (cookieStr: string) => Record<string, string>;
        };
        url: {
            parse: (urlStr: string) => {
                query: string | null;
            };
        };
    };
}
/**
 * Add data from the given request to the given event
 *
 * @param event The event to which the request data will be added
 * @param req Request object
 * @param options.include Flags to control what data is included
 * @param options.deps Injected platform-specific dependencies
 * @hidden
 */
export declare function addRequestDataToEvent(event: Event, req: PolymorphicRequest, options?: AddRequestDataToEventOptions): Event;
export {};
//# sourceMappingURL=requestdata.d.ts.map
