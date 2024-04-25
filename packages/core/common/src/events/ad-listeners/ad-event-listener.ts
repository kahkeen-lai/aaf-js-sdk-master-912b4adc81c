import { AdEvent } from '../ad-events/ad-events';

export type AdEventListener = (adEvent: AdEvent) => void;
