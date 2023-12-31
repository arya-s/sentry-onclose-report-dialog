import { CustomSamplingContext, TransactionContext } from '@sentry/types';
import { Hub } from '../hub';
import { IdleTransaction } from './idletransaction';
/**
 * Create new idle transaction.
 */
export declare function startIdleTransaction(hub: Hub, transactionContext: TransactionContext, idleTimeout: number, finalTimeout: number, onScope?: boolean, customSamplingContext?: CustomSamplingContext, heartbeatInterval?: number): IdleTransaction;
/**
 * Adds tracing extensions to the global hub.
 */
export declare function addTracingExtensions(): void;
//# sourceMappingURL=hubextensions.d.ts.map
