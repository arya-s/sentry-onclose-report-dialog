import type { Breadcrumb } from '@sentry/types';
import type { ReplayContainer } from '../types';
import type { DomHandlerData } from './util/domUtils';
export declare const handleDomListener: (replay: ReplayContainer) => (handlerData: DomHandlerData) => void;
/** Get the base DOM breadcrumb. */
export declare function getBaseDomBreadcrumb(target: Node | null, message: string): Breadcrumb;
/**
 * An event handler to react to DOM events.
 * Exported for tests.
 */
export declare function handleDom(handlerData: DomHandlerData): Breadcrumb | null;
//# sourceMappingURL=handleDom.d.ts.map