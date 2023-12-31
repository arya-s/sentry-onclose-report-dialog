import type { Integration } from '@sentry/types';
/** Patch toString calls to return proper name for wrapped functions */
export declare class FunctionToString implements Integration {
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    name: string;
    constructor();
    /**
     * @inheritDoc
     */
    setupOnce(): void;
}
//# sourceMappingURL=functiontostring.d.ts.map