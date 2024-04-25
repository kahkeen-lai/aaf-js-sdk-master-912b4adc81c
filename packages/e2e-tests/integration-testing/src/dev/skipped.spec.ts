/* eslint-disable @typescript-eslint/no-empty-function */
// a test folder must contain at least one test due to jest limitations, therefore a 'dummy' test exists and is skipped
describe.skip('skipped', () => {
  it.skip('skipped test', () => {});
});
