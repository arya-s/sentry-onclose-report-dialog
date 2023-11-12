import type { Scope } from '@sentry/core';
import type { IntegrationIndex } from '@sentry/core/build/types/integration';
import type { Client, ReplayEvent } from '@sentry/types';
/**
 * Prepare a replay event & enrich it with the SDK metadata.
 */
export declare function prepareReplayEvent({ client, scope, replayId: event_id, event, }: {
    client: Client & {
        _integrations?: IntegrationIndex;
    };
    scope: Scope;
    replayId: string;
    event: ReplayEvent;
}): Promise<ReplayEvent | null>;
//# sourceMappingURL=prepareReplayEvent.d.ts.map