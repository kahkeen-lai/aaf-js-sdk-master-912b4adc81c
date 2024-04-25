/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/naming-convention */
import { XaafAdContainer, XaafContainerListener, XaafElement, XaafElementType } from '@xaaf/xaaf-js-sdk';

/**
 * A mocked XAAF ad container implementation, executing needed callbacks on XAAF container listener to allow
 * XAAF JS SDK to handle those callbacks and the whole executable ad to work properly.
 */
export class MockedXaafAdContainer implements XaafAdContainer {
  private mockedXaafElement;

  /**
   * @param mockedXaafElement The mocked XAAF element (image, video, etc.)
   */
  constructor(mockedXaafElement: unknown) {
    this.mockedXaafElement = mockedXaafElement;
  }

  public setElementType(elementType: XaafElementType, xaafContainerListener: XaafContainerListener<unknown>): void {
    xaafContainerListener.onElementReady(this.mockedXaafElement);
  }

  public clearElementType(): void {
    // no callback is executed on the XAAF container listener (sdk's command) upon request to clear element type
  }
}

export class ElementMock implements XaafElement {}
