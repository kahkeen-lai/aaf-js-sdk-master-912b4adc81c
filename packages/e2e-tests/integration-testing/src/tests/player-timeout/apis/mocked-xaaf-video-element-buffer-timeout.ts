import { MockedXaafVideoElement } from '../../../mock/mocked-xaaf-video-element';

/**
 * A mocked XAAF video element implementation for Player Timout,
 * executing needed callbacks on XAAF video listener to allow
 * XAAF JS SDK to handle those callbacks and the whole executable ad to work properly.
 */
export class MockedXaafVideoElementBufferTimeout extends MockedXaafVideoElement {
  play(): void {
    // simulating platform's execution time
    setTimeout(() => {
      this.xaafElementListener.onBufferingStarted();
    }, 10);
  }
}
