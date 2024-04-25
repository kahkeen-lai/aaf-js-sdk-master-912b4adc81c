/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable quotes */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import express, { Router } from 'express';
import { Request, Response, Router as CoreRouter } from 'express-serve-static-core';
import { REST_STATUS, HTTP_VERBS } from './enum';
import { encode, TAlgorithm } from 'jwt-simple';
import * as os from 'os';
import * as path from 'path';
import { fstat, readFile } from 'fs';
const replace = require('replace-in-file');
const router: CoreRouter = Router();
const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Logging for any incoming request
router.use((req, _res, next) => {
  console.log(`\n ${req.method} ${req.url} \n`);
  next();
});

function setRoute(
  verb: HTTP_VERBS,
  url: string,
  fileNameVariable: string,
  statusVariable: string,
  timeOut: number = 0
): void {
  router[verb](url, async (req: Request, res: Response) => {
    console.log('\n ********** App variables ****************');
    const fileNameValue = req.app.get(fileNameVariable);
    const statusValue = req.app.get(statusVariable);
    console.log('Filename: ' + fileNameValue);
    console.log('Status: ' + statusValue);
    let filePath = '';
    if (req.query.bingeAdStep) {
      filePath = path.join(process.cwd(), 'api', `${fileNameValue}-${req.query.bingeAdStep}-${statusValue}`);
    } else {
      filePath = path.join(process.cwd(), 'api', `${fileNameValue}-${statusValue}`);
    }
    console.log('FilePath retrieved: ' + filePath);

    const data = await fileImport(`${filePath}.json`);
    setTimeout(() => {
      res.status(statusValue);
      console.log('\n ********** Response ****************');
      console.log(JSON.stringify(data));
      res.json(data);
    }, timeOut);
  });
}

setRoute(HTTP_VERBS.POST, '/auth/V1/login', 'loginFileName', 'loginStatus');
setRoute(HTTP_VERBS.POST, '/auth/V2/login', 'loginFileName', 'loginStatus');
setRoute(HTTP_VERBS.GET, '/xaaba/V1/opportunity', 'opportunityFileName', 'opportunityStatus');

router.post('/setLoginConfig', (req: Request, res: Response) => {
  console.log(req.body);
  req.app.set('loginFileName', req.body.fileName);
  req.app.set('loginStatus', req.body.status);

  console.log(`setLoginConfig with filename: ${req.app.get('loginFileName')} and status ${req.app.get('loginStatus')}`);
  res.sendStatus(REST_STATUS.OK);
});

router.post('/setOpportunityConfig', (req: Request, res: Response) => {
  console.log(req.body);
  req.app.set('opportunityFileName', req.body.fileName);
  req.app.set('opportunityStatus', req.body.status);

  console.log(
    `setOpportunityConfig with filename: ${req.app.get('opportunityFileName')} and status ${req.app.get(
      'opportunityStatus'
    )}`
  );
  res.sendStatus(REST_STATUS.OK);
});

// API Key Generation

export async function generateMockToken() {
  const ifaces = os.networkInterfaces();
  let token;
  const ip = getIp(ifaces);
  const replaceArrayResult: Array<any> = [];
  const payload = buildPayload(ip);
  const keys = generatePublicPrivateKeys();
  console.log(token);
  console.log(`ip: ${ip}`);
  token = encodeSession(keys.privateKey, payload);
  replaceArrayResult.push(await findReplaceToken(encodeSession(keys.privateKey, payload, 'HS256')));
  replaceArrayResult.push(await findReplaceApiKey(token));
  replaceArrayResult.push(await findReplaceLoginXaaba(ip));
  return {
    token,
    payload,
    replaceArrayResult
  };
}

router.get('/generate', async (req: Request, res: Response) => {
  try {
    console.log(`\n ${req.method} ${req.url} \n`);
    const generateResponse = await generateMockToken();
    console.log('Generated mock token Response: ' + JSON.stringify(generateResponse));
    res.status(200);
    res.json(generateResponse);
  } catch (error) {
    console.log(error);
    res.status(400);
    res.json(error);
  }
});

const findReplaceApiKey = async token => {
  let results;
  const options = {
    files: ['../demos/DemoTvOs/src/config/api-key-config.ts'],
    from: '{{mock-token}}',
    to: token
  };
  try {
    const replaceResponse = await replace(options);
    results = createMessageForReplaceApiKeys(replaceResponse, token);
    console.log('Replacement results:', results);
  } catch (error) {
    console.error('Error occurred:', error);
  }
  return results;
};

function createMessageForReplaceApiKeys(replaceResponse, token) {
  return replaceResponse.map(value => ({
    replace: value,
    info: value.hasChanged
      ? `Mock token successfully changed to: ${token}`
      : `Pay attention that the Mock token is not changed it may not working well, please check api-key-config file ({{mock-token}} is missing)`
  }));
}

const findReplaceToken = async token => {
  let results;
  const options = {
    files: path.join(process.cwd(), 'api', 'login-200.json'),
    from: '{{mock-token}}',
    to: `${token}`
  };
  try {
    results = await replace(options);
    console.log('Replacement results:', results);
  } catch (error) {
    console.error('Error occurred:', error);
  }
  return results;
};

const findReplaceLoginXaaba = async ip => {
  let results;
  const options = {
    files: path.join(process.cwd(), 'api', 'login-200.json'),
    from: 'http://localhost:4202/xaaba/v1/opportunity',
    to: `http://${ip}:4202/xaaba/v1/opportunity`
  };
  try {
    const replaceResponse = await replace(options);
    results = createMessageForXabbaUrl(replaceResponse, `http://${ip}:4202/xaaba/v1/opportunity`);
    console.log('Replacement results:', results);
  } catch (error) {
    console.error('Error occurred:', error);
  }
  return results;
};

function createMessageForXabbaUrl(replaceResponse, URL) {
  return replaceResponse.map(value => ({
    replace: value,
    info: value.hasChanged
      ? `Xaaba URL successfully changed to: ${URL}`
      : `Pay attention that Xaaba URL is not changed, 'get opportunity' will not working well, please check login-200 file (Change xaaba url to: 'http://localhost:4202/xaaba/v1/opportunity')`
  }));
}

function validateIPaddress(ipaddress) {
  let _isValid = false;
  if (ipRegex.test(ipaddress)) {
    _isValid = true;
  }
  return _isValid;
}

function getIp(ifaces) {
  let ip: string;
  Object.keys(ifaces).forEach(ifname => {
    ifaces[ifname].forEach(iface => {
      if (ifname === 'en0' && validateIPaddress(iface.address)) {
        console.log(`ifname ${ifname}`);
        ip = iface.address;
        console.log(`iface.address ${iface.address}`);
      }
    });
  });

  return ip || 'localhost';
}

function encodeSession(secretKey: string, payload: any, algo: TAlgorithm = 'RS256') {
  // Always use HS512 to sign the token
  const algorithm: TAlgorithm = algo;
  return encode(payload, secretKey, algorithm);
}

async function fileImport(filePath: string) {
  return new Promise((resolve, reject) => {
    readFile(filePath, { encoding: 'utf-8' }, (error, data) => {
      if (!error) {
        try {
          const returnData = JSON.parse(data);
          resolve(returnData);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(error);
      }
    });
  });
}

function buildPayload(ip) {
  // Determine when the token should expire
  const issued = Date.now() / 1000;
  const minutes = 500;
  const timeInSeconds = minutes * 60;
  const expires = issued + timeInSeconds;

  return {
    tenantId: '5dd52da521406e001dda4465',
    appId: '5dd52da621406e001dda4467',
    platformName: 'firetv',
    sdkVersion: 'v1',
    sdkName: 'js-sdk-youi',
    enabled: true,
    host: `http://${ip}:4202`,
    platformType: 'firetv-youi',
    environment: 'mock',
    iat: 1589803355,
    iss: 'AT&T',
    sub: 'ApiKey',
    issued: issued,
    exp: expires
  };
}

function generatePublicPrivateKeys() {
  const privateKey = `LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlDWFFJQkFBS0JnUUNqRkc0VExkNHU0SjN6Q2VKaW1ESWo2M3R3Q0ovTjJ4cmcwbG1IdlBHL05VMlVPRVR1CmRmQ3J6bU5hMHRDYml5N0ZOQUxwejNkU0tveWNmRTNHU05lQStZZmhUUzBBaWZ2MGk3c2NManErZ2x3STBvdS8KcXdHWDFKaktGT0JSaEZiTnlXbVovZGZtcU5wWWJYdmpBZmU4STREZjZ1RUNtQ0ZCeWhadUdLUXFUUUlEQVFBQgpBb0dCQUlaYjc3RFhpb1hldytPWVVpOWZLM2hTckJtSzBYYStQVy9iZnE0SjZyYlppTGhFZis1anQwMGx0cy8rCmZxYVlUb2xsSjcxUkZBTGJVWXdnRWNmNi9hbFJ0R243Z1gyNUdWOGM1OUR1a0UyaGtXUVpFcngzT1RkakRGVjQKbnRHZFpPeTZJblFhRS9xZjZBcUNWUHB3c2V6NUp0ejdDT2dkaUdNMlZ5M0JybnpWQWtFQXoxOVBwRVlnSE13SgpSdzZ6cVdWQ1pWYWlvakMzdjZ1NXBTeGFZeTRJb0FqZW4rNElpSExXdytjZis2WW5FZE1OckN6Y1BCcEhuNjRkCitNQXNEcng4ZHdKQkFNbFNObFhtaU1KaGlOSXlzWWYvK3FXR04vY0ZjempMS0RWQnJZbk5nZW00bGlRdzBCbnMKUFVEMWdQYkhycTdxeWQxekFJb3dhNFowaDhEcnp2d3lkRnNDUURDZFk0cGJka1BLQVpMSys0dUcxWjMwUllSSQpiNHRic3RYcUkvYUVZRGxFV3d5YlBSemY3MEZWK2NXQkdqK3ZmdEVTWXo4ajJnNnhQdzJGMzg1RW1ka0NRR2lsCmRWejlja1VvRWNqQlZRck9nbWtiOVdkUHkrN1BtMXpqZ09OS2thYjlyZjJ0NmQ0dnNEOWQzZVZwTW1IMTVXeFkKNVFUdjJsU1BxaWtiNmdHcDhGVUNRUUNxL05MTUpTa2lyQi9ncUw0TXZDb2ZidmVYUE8zZXJ0LzdBVnJjdE9zZQp4MjZpWDN5WEpmT2E2VEJwVnVlVnVTQnJ6bWVnNzNUV0xkSDVLcjgwWllaawotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQ==`;
  const buff = Buffer.from(privateKey, 'base64');
  const text = buff.toString('utf-8');
  return { privateKey: text };
}

export default router;
