// get keys from env file
export class IntegrationApiKeyConfig {
  // mock api key https://xaaf-be-aio.att.com/advertise-5988/mock
  static devMockApiKey: string = process.env.DEV_MOCK_APIKEY;
  // novpn environment is xaaf-be-aio.att.com/advertise-5988 environment
  static noVpnApiKey: string = process.env.NO_VPN_APIKEY;
  // tlv-dev-firetv  https://xaaf-be-dev.att.com
  static tlvDevFiretvApiKey: string = process.env.TLV_DEV_FIRETV_APIKEY;
  // tlv-lal  https://xaaf-be-lal.att.com
  static tlvLal: string = process.env.TLV_LAL_APIKEY;
  static general: string = process.env.GENERAL_APIKEY;
}

export class IntegrationUrlConfig {
  static tlvDevFiretv: string = process.env.TLV_DEV_FIRETV_URL;
  static tlvLal: string = process.env.TLV_LAL_URL;
  static general: string = process.env.GENERAL_URL;
}

export class IntegrationNRConfig {
  static tlvDevFiretvAccountId = process.env.TLV_DEV_FIRETV_NR_ACCOUNT_ID;
  static tlvDevFiretvQueryKey = process.env.TLV_DEV_FIRETV_NR_QUERY_KEY;
  static tlvlalFiretvAccountId = process.env.TLV_LAL_NR_ACCOUNT_ID;
  static tlvlalFiretvQueryKey = process.env.TLV_LAL_NR_QUERY_KEY;
  static generalAccountId = process.env.GENERAL_NR_ACCOUNT_ID;
  static generalQueryKey = process.env.GENERAL_NR_QUERY_KEY;
}
