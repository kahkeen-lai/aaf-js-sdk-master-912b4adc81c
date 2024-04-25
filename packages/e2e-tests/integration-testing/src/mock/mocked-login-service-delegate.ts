import * as Core from '@xaaf/common';

/**
 * A mocked LoginServiceDelegate, to be used as a delegate for a real LoginService.
 */
export class MockedLoginServiceDelegate implements Core.StorageService {
  private _mockedStorage = new Map<string, string>();

  async getItem(key: string): Promise<string> {
    const value = this._mockedStorage.get(key);
    return value === undefined ? null : value;
  }

  async setItem(key: string, value: string): Promise<void> {
    this._mockedStorage.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this._mockedStorage.delete(key);
  }
}
