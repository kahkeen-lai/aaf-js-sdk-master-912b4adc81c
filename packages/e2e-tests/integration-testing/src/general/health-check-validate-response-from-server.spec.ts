/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */
import {
  HttpService,
  XaafJsSdk,
  LoginService,
  Xip,
  ConfigService,
  CommandReport,
  ArrayHelper,
  ContainerDef,
  InjectionContainer,
} from "@xaaf/xaaf-js-sdk";
import { ErrorResponse, HttpResponse } from "@xaaf/common";
import { IntegrationApiKeyConfig } from "../environment";
import { setXaafJsSdkServiceMockDelegates } from "../utils";
jest.unmock("axios");

let sdk, configMap;

describe("health check validate response from server", () => {
  jest.setTimeout(8000 * 10);
  configMap = new Map([
    ["platformAdvId", "platformAdvId:e2eTest"],
    ["deviceUUID", "deviceUUID:e2eTest"],
  ]);
  sdk = new XaafJsSdk();
  setXaafJsSdkServiceMockDelegates();

  it("validate login and get opportunity requests responses from server", (done) => {
    sdk.initialize(IntegrationApiKeyConfig.general, configMap);

    const loginRequestId = "loginRequestIdStub";
    const key_service_1 = require("@xaaf/key-service");
    const keyService = new key_service_1.XaafKeyService();
    const tokenData = keyService.decode(IntegrationApiKeyConfig.general);
    LoginService.getInstance()
      .getLoginResponse(
        IntegrationApiKeyConfig.general,
        tokenData,
        configMap,
        loginRequestId
      )
      .then(async (loginRes) => {
        expect(loginRes.token.length).not.toEqual(0);
        expect(loginRes.refreshToken.length).not.toEqual(0);
        expect(loginRes.configuration.nr_rest_api_key.length).not.toEqual(0);
        expect(loginRes.configuration.nr_url.length).not.toEqual(0);
        expect(loginRes.configuration.rollout_api_key.length).not.toEqual(0);
        expect(loginRes.configuration.xaaba_url.length).not.toEqual(0);
        expect(
          loginRes.configuration.lazy_refresh_token_before_expiration_minutes
        ).toBeGreaterThan(0);
        expect(loginRes.configuration.http_timeout).toBeGreaterThan(0);
        expect(loginRes.configuration.xaaba_timeout).toBeGreaterThan(0);
        expect(loginRes.configuration.assets_timeout).toBeGreaterThan(0);
        expect(loginRes.configuration.player_timeout).toBeGreaterThan(0);
        expect(loginRes.configuration.buffer_timeout).toBeGreaterThan(0);
        expect(loginRes.configuration.reporting_timeout).toBeGreaterThan(0);
        expect(loginRes.configuration.reporting_bulk).toBeGreaterThan(0);
        expect(loginRes.configuration.reporting_bulk_delay).toBeGreaterThan(0);

        const args = new Map<string, string>([
          ["platform", "dfw"],
          ["sdkName", "tvos"],
          ["contentType", "vod"],
          ["userType", "2"],
          ["sdkVersion", "v1"],
          ["tenantSystemName", "directv"],
          ["deviceType", "tvos"],
          ["opportunityType", "screensaver"],
          ["userAdvrId", "111"],
        ]);

        try {
          const res = await getOpportunity(
            loginRes.configuration.xaaba_url,
            loginRes.token,
            args,
            "aaasdf"
          );

          expect(res.status).toEqual(200);
          expect((res.body as Xip).commands.length).toBeGreaterThan(0);

          for (const command of (res.body as Xip).commands) {
            expect(command.report.providers.length).toBeGreaterThan(0);
            expect(command.executionTriggers.length).toBeGreaterThan(0);

            if (command.commandName === "SHOW_VIDEO") {
              validateCommandReport(command.report);
            }
          }
        } catch (error) {
          console.error(error);
        }
      });
  });
});

async function getOpportunity(
  url: string,
  tokenData: string,
  args: Map<string, string>,
  executableAdID: string
): Promise<HttpResponse<Xip | ErrorResponse>> {
  const _httpService: HttpService = InjectionContainer.resolve<HttpService>(
    ContainerDef.httpService
  );
  const params = ArrayHelper.mapToRecord(args);

  const timeout = ConfigService.getInstance().timeouts.xaaba;
  return _httpService.get<Xip | ErrorResponse>(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenData}`,
      "X-Request-ID": executableAdID,
    },
    params,
    timeout,
  });
}

function validateCommandReport(commandReport: CommandReport): void {
  for (const provider of commandReport.providers) {
    if (provider.name === "Emuse") {
      for (const event of provider.events) {
        const providerUrl = event.url;
        // expect(providerUrl.includes('Version').toBe(true);
        expect(providerUrl.includes("MeasurementPointID")).toBe(true);
        expect(providerUrl.includes("Version")).toBe(true);
        expect(providerUrl.includes("PageID")).toBe(true);
        expect(providerUrl.includes("ExtSrc")).toBe(true);
        expect(providerUrl.includes("OppType")).toBe(true);
        expect(providerUrl.includes("DeviceType")).toBe(true);
        expect(providerUrl.includes("PartnerProfileID")).toBe(true);
      }
    }
  }
}
