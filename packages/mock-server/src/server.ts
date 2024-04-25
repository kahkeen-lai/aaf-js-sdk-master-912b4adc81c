import express from 'express';
import cors from 'cors';
import router, { generateMockToken } from './router';
import { AddressInfo } from 'net';
import { REST_STATUS } from './enum';
const PORT = 4202;

const app = express();
app.use(cors());
app.use(express.json());

// Configure default responses to SDK requests.
// These can be changed via HTTP requests - see https://wiki.web.att.com/display/AAI/How+to+work+with+Mock+Service+-+Experience+Selection.
// See also https://wiki.web.att.com/pages/viewpage.action?pageId=1251216047 for adding new responses.

app.set('loginFileName', 'login');
app.set('loginStatus', REST_STATUS.OK);

app.set('opportunityFileName', 'opportunity');
app.set('opportunityStatus', REST_STATUS.OK);

app.use('', router);

const server = app.listen(PORT, () => {
  const address: AddressInfo = <AddressInfo>server.address();
  console.log('\n ********** Xaaf js app mock server running at http://localhost:%s ****************', address.port);
  generateMockToken();
});
