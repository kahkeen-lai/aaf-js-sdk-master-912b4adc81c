## Screen Saver on Pause

### step by step integration guide

When the user pauses the video playback, a possible experience could be the **Xandr Screen Saver** on Pause experience, which displays a translucent video ad on top of the paused video frame.

The client has full control and may choose to close the ad following any user interaction, or for any other reason.

**Step 1** – Import XAAF SDK  
Add the following dependency to the package.json file, latest version is 1.1.25:

```
"@xaaf/xaaf-web-sdk": "^1.1.25"
```

Add or edit a file called `.npmrc` in the root folder (next to the package.json file) with the following content:

```bash
@xaaf:registry=http://mavencentral.it.att.com:8081/nexus/repository/npm-advertise/ email=xaaf@intl.att.com _auth=M19GNE9RUko6aXYxMTg0a3l3NlYtWk44SFFBYzA0SDlvV1lWTjBfa0NQX3NPRlFlUlh3RG8=
```

This will use Nexus registry only for dependencies that start with `@xaaf` and will not impact anything else.

Then go ont and install the packages

```
yarn add @xaaf/aaf-rn-sdk
npm i @xaaf/aaf-rn-sdk
```

**Step 2** – Place the XaafAd element inside the view hierarchy

```typescript
 <div>
                        id={'xaafVideoElementName'}
                        ref={xaafContainerRef}
                        style={hostVisible === 1 ? styles.removeVideo : styles.videoVisible}
  <div>
```

Notes:

1. `hostVisible` is a boolean host app state variable that is used to toggle between the video and the ad - it is host app responsibility to handle the viability of the video/Ad (there are couple of ways to do that like setting the video/ad style props e.g. hight, opacity, visibility, flex, width etc..).

2. In the example above we use the `xaafVideoElementName` as an id for assigning the div that will populate the XaafAd property.
   The initAd and StartAd receive the xaafAd parameter after its been created with the id of the `xaafVideoElementName` div.

```
const xaafAd = new XaafAd('xaafVideoElementName')
```

**Step 3** – Initialize an instance of Xaaf SDK

```typescript
import { WebXaafSDK, XaafAd } from "@xaaf/xaaf-web-sdk";

function getGlobalParams() {
  const globalParamsTypeMapper = new Map<string, string>();
  globalParamsTypeMapper.set("platform", "dfw");
  globalParamsTypeMapper.set("deviceType", "tvos");
  globalParamsTypeMapper.set(
    "deviceAdId",
    "aaec17dc-ec32-517b-8f34-074db4c9f5d5"
  );
  globalParamsTypeMapper.set("userAdvrId", "fVxL8dkHB10Exi1+/kjYhQ==");
  globalParamsTypeMapper.set("fwSUSSId", "fVxL8dkHB10Exi1+/kjYhQ==");
  globalParamsTypeMapper.set("householdId", "fVxL8dkHB10Exi1+/kjYhQ==");
  globalParamsTypeMapper.set(
    "deviceAdvrId",
    "198e6038-1ef7-45b0-99c0-81fac6348b2e"
  );
  globalParamsTypeMapper.set("userType", "2");
  globalParamsTypeMapper.set(
    "deviceFWAdId",
    "7112e70355377c66a6bec1b723cd5588e88315a311756bc5bf15d7291f3b9a8b"
  );
  globalParamsTypeMapper.set("tenantName", "directv");
  globalParamsTypeMapper.set("appName", "ov");
  globalParamsTypeMapper.set("appVersion", "3.0.21105.01005");
  globalParamsTypeMapper.set("consoleLogger", "true");
  globalParamsTypeMapper.set("loggerLevel", "debug");
  globalParamsTypeMapper.set("hostRequestId", loginRequestId);
  return globalParamsTypeMapper;
}
let xaafSdk = WebXaafSDK.getInstance();
xaafSdk.xaafInitListener = (xaafEvent: XaafEvent) => {
  // use events as needed from xaafEvent
};
xaafSdk.initialize(apiKey, getGlobalParams());
```

Notes:

1. SDK initialize method is used to authenticate against the xaaf BE.
2. API_KEY is per platform – Please refer to API Keys section.
3. `xaafInitListener` is an optional event listener.
4. The values of `getGlobalParams` should be filled according to the table below.

> From version 1.0.41 - You can get the version of the SDK by using get function `xaafSdkVersion`.

**Step 4**

Get Executable Ad Object  
 On every ad opportunity, the host app should generate an ExecutableAd Object using the `getExecutableAd` method of the SDK instance.

```typescript
import {
  WebXaafSDK,
  OpportunityType,
  AdEventType,
  AdEvent,
  XaafAd,
} from "@xaaf/xaaf-web-sdk";
let xaafSdk = WebXaafSDK.getInstance();
const opportunity = OpportunityType.Pause;
const opportunityInfo: OpportunityInfo = {
  opportunity,
  arguments: new Map([
    ["context", "pause"],
    ["hostRequestId", adRequestId],
  ]),
};
const executableAd = xaafSdk.getExecutableAd(opportunityInfo);
executableAd.executableAdEventListener = (adEvent) => {
  if (adEvent.type === AdEventType.Loaded) {
    setTimeout(this.startScreenSaverAd, AD_START_DELAY_HINT);
  }
};
const xad = ExecutableAd;
```

Notes:

1. The values of `arguments` are optional.
2. `opportunity' – represent the opportunity that is transferred to xaaf BE (for “Screen Saver on Pause experience” the value should be “screensaver” - we recommend to use OpportunityType.PAUSE as imported from "@xaaf/xaaf-web-sdk"'.
3. AD_START_DELAY_HINT – is a constant representing the delay in millisecond until the ad should be displayed after the pause.

Executable Ads Attributes

```typescript
let xaafSdk = WebXaafSDK.getInstance();
const opportunityInfo = {
  opportunity: OpportunityType.PAUSE,
  arguments: new Map([
    ["context", "pause"],
    ["hostRequestId", adRequestId],
  ]),
};
const executableAd = xaafSdk.getExecutableAd(opportunityInfo);
const attr = "state";
const attributeValue = executableAd.getAttribute(attr);
```

> The valid values for `attr` parameter are:
>
> - executableAdId
> - experienceId
> - adMediaType
> - state

**Step 5**
Init Executable Ad

```typescript
import { OpportunityType, XaafAd, WebXaafSDK } from "@xaaf/xaaf-web-sdk";
const SECOND = 1000;
const AD_START_DELAY_HINT = 30 * SECOND;
const executableAdInitArgs = new Map([
  ["networkName", "abc"],
  ["isDuringAd", "true"],
  ["channelName", "espn"],
  ["programmerName", "disney"],
  ["adStartDelayHint"],
  [AD_START_DELAY_HINT],
  ["expType", "out_of_stream"],
  ["contentType", "vod"],
  ["channelId", "12345"],
  ["programName", "game_of_throne"],
  ["hostCCPAEnabled", "true"],
]);
executableAd.initAd(xaafContainerRef, executableAdInitArgs);
```

Notes:

1. `InitAd` method just loads an ad from the server, it doesn`t play it.
2. The `executableAdInitArgs` should be filled in according to the table in the next page.
3. The values of `executableAdInitArgs` will override values if also provided in the executableAd creation time (for the same keys).

**Step 6** – play / start ad  
‘xaafContainerRef’ - Reference to the xaaf-ad component.

```typescript
executableAd.startAd(this.xaafAd);
this.hostVisible = false;
```

**Step 7** – stop / hide ad

```typescript
this.hostVisible = true;
executableAd?.stopAd();
this.createExecutableAd();
```

> Note: it is recommended to create another Ad instance just after stopAd.
