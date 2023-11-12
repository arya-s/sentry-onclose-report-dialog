import { Client } from './client';
import { Envelope } from './envelope';
import { TextEncoderInternal } from './textencoder';
export type TransportRequest = {
    body: string | Uint8Array;
};
export type TransportMakeRequestResponse = {
    statusCode?: number;
    headers?: {
        [key: string]: string | null;
        'x-sentry-rate-limits': string | null;
        'retry-after': string | null;
    };
};
export interface InternalBaseTransportOptions {
    bufferSize?: number;
    recordDroppedEvent: Client['recordDroppedEvent'];
    textEncoder?: TextEncoderInternal;
}
export interface BaseTransportOptions extends InternalBaseTransportOptions {
    url: string;
}
export interface Transport {
    send(request: Envelope): PromiseLike<void | TransportMakeRequestResponse>;
    flush(timeout?: number): PromiseLike<boolean>;
}
export type TransportRequestExecutor = (request: TransportRequest) => PromiseLike<TransportMakeRequestResponse>;
//# sourceMappingURL=transport.d.ts.map