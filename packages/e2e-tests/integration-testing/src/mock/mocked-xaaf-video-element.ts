import { XaafVideoElement, XaafVideoListener } from '@xaaf/xaaf-js-sdk';
import { XaafVideoData } from '@xaaf/xaaf-js-sdk';

/**
 * A mocked XAAF video element implementation, executing needed callbacks on XAAF video listener to allow
 * XAAF JS SDK to handle those callbacks and the whole executable ad to work properly.
 */
export class MockedXaafVideoElement implements XaafVideoElement {
  xaafElementListener: XaafVideoListener;
  data: XaafVideoData;

  setData(data: XaafVideoData): void {
    this.data = data;
    // duration change callback is executed here to allow show video command
    // to get the duration before attempting to play
    this.xaafElementListener?.onDurationChanged(1);
  }

  play(): void {
    // simulating platform's execution time
    setTimeout(() => {
      this.xaafElementListener?.onPlaying();
    }, 10);
  }

  pause(): void {
    // no callback is executed on the video element listener (sdk's show video command)
    // upon request to pause the playback
    // or upon playback actually being paused
  }

  stop(): void {
    // no callback is executed on the listener (sdk's show video command) upon request to stop the playback
  }

  rewind(): void {
    // no callback is executed on the listener (sdk's show video command) upon request to rewind the playback
  }

  getCurrentBuffer(): Promise<number> {
    return new Promise(resolve => {
      // simulating platform's execution time
      setTimeout(() => {
        resolve(1);
      }, 10);
    });
  }
}
