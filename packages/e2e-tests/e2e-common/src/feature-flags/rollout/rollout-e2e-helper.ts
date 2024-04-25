/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
const request = require('request');

export class RolloutServiceE2eHelper {
  appId: string;
  userToken: string;
  environment: string;
  rolloutQuery: string;

  constructor(appId: string, userToken: string, environment: string) {
    this.appId = appId;
    this.userToken = userToken;
    this.environment = environment;
    this.rolloutQuery = `https://x-api.rollout.io/public-api/applications/${appId}/${environment}/experiments`;
  }

  async getRolloutFeatureFlag(key: string): Promise<unknown> {
    const httpRequestOptions = {
      method: 'GET',
      url: `${this.rolloutQuery}/${key}`,
      headers: {
        authorization: `Bearer ${this.userToken}`,
        accept: 'application/json'
      }
    };

    const res = await new Promise((resolve, reject) => {
      request(httpRequestOptions, (error, response, body) => {
        if (response.statusCode === 200) {
          body = JSON.parse(body);
          console.debug(`Key ${key} found with value ${body.value}.`);
          resolve(body.value);
        } else if (response.statusCode === 404) {
          console.debug(`Key ${key} does not exist.`);
          resolve(null);
        } else {
          console.error(`Failed to get rollout feature flag: ${error}`);
          reject(error);
        }
      });
    });
    return res;
  }

  async getFeatureFlag(key: string): Promise<unknown> {
    return this.getRolloutFeatureFlag(key);
  }

  async setFeatureFlag(key: string, value: boolean): Promise<boolean> {
    const ffValue = await this.getFeatureFlag(key);

    // the feature flag doesn't exist, need to create it
    if (ffValue === null) {
      const httpRequestOptions = {
        method: 'PUT',
        url: `${this.rolloutQuery}`,
        body: `{ "value": ${value}, "type": "experiment", "flag": "${key}"}`,
        headers: {
          authorization: `Bearer ${this.userToken}`,
          'content-type': 'application/json'
        }
      };
      console.debug(`setFeatureFlag: Creating ${key} with value ${value}`);
      const hasSetFlag = await new Promise<boolean>((resolve, reject) => {
        request(httpRequestOptions, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            console.debug(`Key ${key} created with value ${value}.`);
            resolve(true);
          } else {
            console.error(`Failed to create rollout feature flag: ${error}`);
            reject(false);
          }
        });
      });
      return hasSetFlag;
    }
    // the feature flag already exists
    else {
      // need to update the value
      if (ffValue !== value) {
        const httpRequestOptions = {
          method: 'PATCH',
          url: `${this.rolloutQuery}/${key}`,
          body: `[
          {
            "op": "replace",
            "path": "/value",
            "value": ${value}
          }
        ]`,
          headers: {
            authorization: `Bearer ${this.userToken}`,
            'content-type': 'application/json'
          }
        };
        console.debug(`setFeatureFlag: Updating ${key} value from ${ffValue} to ${value}`);
        const hasSetFlag = await new Promise<boolean>((resolve, reject) => {
          request(httpRequestOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              console.debug(`Key ${key} updated with value ${value}.`);
              resolve(true);
            } else {
              console.error(`Failed to update rollout feature flag: ${error}`);
              reject(false);
            }
          });
        });
        return hasSetFlag;
      }
      // no need to change the value
      else {
        console.debug(`No need to change the flag value`);
        return true;
      }
    }
  }
}
// API Usage example:
// const rsHelper = new RolloutServiceE2eHelper(
//     '5c7e4d0f0de22c766f60678f',
//     '91aa0af5-d513-48b1-908c-4b2257119444',
//     'E2E%20Testing');
//
// console.log(rsHelper.getFeatureFlag('avi'));
