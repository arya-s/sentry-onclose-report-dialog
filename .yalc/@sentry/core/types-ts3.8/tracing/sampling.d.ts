import { Options, SamplingContext } from '@sentry/types';
import { Transaction } from './transaction';
/**
 * Makes a sampling decision for the given transaction and stores it on the transaction.
 *
 * Called every time a transaction is created. Only transactions which emerge with a `sampled` value of `true` will be
 * sent to Sentry.
 *
 * This method muttes the given `transaction` and will set the `sampled` value on it.
 * It returns the same transaction, for convenience.
 */
export declare function sampleTransaction<T extends Transaction>(transaction: T, options: Pick<Options, 'tracesSampleRate' | 'tracesSampler' | 'enableTracing'>, samplingContext: SamplingContext): T;
//# sourceMappingURL=sampling.d.ts.map
