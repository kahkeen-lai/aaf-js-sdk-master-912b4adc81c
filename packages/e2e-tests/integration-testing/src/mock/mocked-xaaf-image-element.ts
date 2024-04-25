/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { XaafImageData, XaafImageElement, XaafImageListener } from '@xaaf/xaaf-js-sdk';

/**
 * A mocked XAAF image element implementation, executing needed callbacks on XAAF image listener to allow
 * XAAF JS SDK to handle those callbacks and the whole executable ad to work properly.
 */
export class MockedXaafImageElement implements XaafImageElement {
  public _xaafElementListener: XaafImageListener;

  setData(data: XaafImageData): void {
    // simulating platform's execution time
    setTimeout(() => {
      this._xaafElementListener.onImageLoaded();
    }, 10);
  }

  show(): void {
    // simulating platform's execution time
    setTimeout(() => {
      this._xaafElementListener.onImageShown();
    }, 10);
  }

  hide(): void {
    // no callback is executed on the image element listener (sdk's show image command) upon request to hide the image
  }
}
