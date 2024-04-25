/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
const request = require('request');

export class MockServerHelper {
  async setupLogin(fileName: string, status: number): Promise<void> {
    console.log('setupLogin: Start to setup Login mock');
    const options = {
      method: 'POST',
      url: `http://localhost:4202/setLoginConfig`,
      headers: {
        accept: 'application/json'
      },
      json: true,
      body: {
        fileName: fileName,
        status: status
      }
    };

    await request(options, (error, response, body): boolean => {
      if (error) {
        console.log('setupLogin: Failed to setup mock server');
        console.error(error);
        return false;
      }
      console.log(`setupLogin: login mock server setup successfully with response body: ${body}`);
      return true;
    });
  }

  async setupOpportunity(fileName: string, status: number): Promise<void> {
    console.log('setupOpportunity: Start to setup getOpportunity mock');
    const options = {
      method: 'POST',
      url: `http://localhost:4202/setOpportunityConfig`,
      headers: {
        accept: 'application/json'
      },
      json: true,
      body: {
        fileName: fileName,
        status: status
      }
    };
    await request(options, (error, response, body): boolean => {
      if (error) {
        console.log('setupOpportunity: Failed to setup mock server');
        console.error(error);
        return false;
      }
      console.log(`setupOpportunity: getOpportunity mock server setup successfully with response body: ${body}`);
      return true;
    });
  }
}
