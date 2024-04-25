## Introduction

The XandrAdvertising Application Framework (XAAF) enables interactive and enriched ad experiences. This document is a guide for a hands-on integration of the XAAF SDK.

## Executable Ad

The Executable Ad represents the lifecycle of an ad. When the host client determines there is an appropriate ad opportunity, it requests an ad from the SDK, while passing the type of an opportunity (e.g. screen saver). The SDK will create the matching executable ad instance. The executable ad handles the ad experience and its rendering, within a container view provided by the host client.

At the appropriate time, the host client will control the executable ad via its life cycle methods. The executable ad will publish events to the hosting app, notifying it about user interactions and rendering progress.

# XAAF integration guide for Web JS SDK

## The xaaf-ad component

The xaaf-ad component is an HTML video element that represents an Ad.
It should be placed inside the view hierarchy with assigned reference to it.
The id variable should later be used as an input to the executable Ad APIs
Example of xaaf-ad component that should be placed into the view hierarchy:

```
const xaafVideoElementName = ‘xaafVideoElementName’

<div>
          id={xaafVideoElementName}
          style={hostVisible === 1 ? styles.removeVideo : styles.videoVisible}
<div>
```

In the example we use the setXaafAd as method for assigning the inner ‘xaafContainerRef’ property.
Make Sure its identical to the ID supplied in the video element.

```
   setXaafAd(new XaafAd(xaafVideoElementName));
```

## When to create an Ad

In general, we recommend creating an executable ad when advertisement opportunity is recognized. For Screen Saver on Pause opportunity this will be when stream playback is prepared, and basic asset attributes are known.
In addition, we suggest creating an ad immediately after the previous one finished its execution (to support more than one Screen Saver Ad during the same asset playback). Application can create as many executable ads as it finds necessary, but only one ad at a time should be initialized and started.
`getExecutableAd` method of the sdk instance is used to create a new Ad.

```typescript
const executableAd: any = sdkContext.getExecutableAd(opportunityInfo);
```

**Input:**

OpportunityInfo object should be used as input to the getExecutableAd function.

The OpportunityInfo contains:

- opportunity – represent the opportunity that is transferred to xaaf BE (forScreen Saver on Pause experience the value should be “screensaver” - we recommend to use OpportunityType.PAUSE as imported from @xaaf/xaaf-web-sdk.
- "arguments"– a map with additional info – currently no additional data is required.

The following is the ‘OpportunityType’ enum and ‘OpportunityInfo’ interface:

```typescript
enum OpportunityType {
  PAUSE = "screensaver",
  CREDITS = "squeeze"
}

interface OpportunityInfo {
  opportunity: OpportunityType;
  arguments: Map<string, string>;
}
```

- Executable ad notifies its hosting application about its lifecycle events. To get these notifications, the hosting application should assign the appropriate event observer / listener.

## When to initialize an Ad

The Screen Saver ad must be initialized before it can be displayed. It should be done when the playback is paused by using `initAd` method.

```properties
initAd(el: XaafElement, initAdinfo: Map<string, string>): Promise<ExitCode>;
```

**Input:**

1. el - Reference to the xaaf-ad component.
2. initAdinfo - Map with additional data to pass – mandatory and optional data.

For detailed parameter types and values see table below.

## When to start an Ad

The Screen Saver Ad should be started when the ad playback is desired by using "startAd" method:

```properties
xad?.startAd(xaafAd);
```

"xad" – the same reference used in initAd method.

We recommend allowing a couple of seconds (configurable) of delay before starting an ad after user selected to pause the content playback, to ensure that user does not intend to resume the playback immediately or perform any other action. Similarly, any interaction with remote control should delay the ad beginning. If no interaction with remote was detected for the specified interval, then the ad can be started.
It is required that the delay time will be transferred as one of the params to ‘initAd’ method with key named “adStartDelayHint” see table below.

## When to stop an Ad

The Screen Saver Ad will stay on the screen until stopped. The decision to stop the ad is up to the hosting application. We recommend stopping the Screen Saver Ad when the user interacts with remote control, when new asset is selected or when the application is suspended to the background.

```typescript
stopAd(): void;
```

## When to release an Ad

We recommend releasing an ad instance (to nullify its reference) when the hosting client receives _adStopped_ or _adError_ event.

## Executable Ad reporting events

The executable ad reports some life cycle events during its lifetime. To get these notifications the hosting application should provide an observer/listener, implementing corresponding protocol/interface. The hosting client will be notified when:

- ad was initialized and is ready to play (_ad loaded_ event - STATE_LOADED),
- ad has started playing (_ad started_ event – STATE_STARTED)
- ad was stopped (_ad stopped_ event with reason (of type String – STATE_STOPPED))
- an error occurred during the ad life cycle (_ad error_ event – STATE_ERROR)

## Error handling

Errors may occur during login, when requesting an ad or during the executable ad playback.

### Login errors

The XAAF SDK will handle all login errors internally. No action is needed by the hosting app.

### Error when requesting an ad

In case an ad is requested before the SDK is initialized, an executable ad will be returned but will be in the STOPPED state, with the hosting app getting a lifecycle notification.

### Executable ad errors

When the executable ad has a failure, the hosting client will be notified by an unrecoverable error event, accompanied by an error object containing additional information pertaining to an error. If such error happens, the ad UI will be removed from the container.

The executable ad object should be released in this case. The hosting client should continue as usual and can request another executable ad for the next ad opportunity.

### Non-fatal error (warning)

When the hosting client does not follow the executable ad life cycle expectations, a warning event will be sent to the hosting client stating an "invalid state transition". After such a warning, the executable ad can continue with its life cycle.

# Screen Saver on Pause - step by step integration guide

When the user pauses the video playback, a possible experience could be the _Xandr Screen Saver on Pause_ experience, which displays a translucent video ad on top of the paused video frame. The client has full control and may choose to close the ad following any user interaction, or for any other reason.

## Step 1 – Import XAAF SDK

Add the following dependency to the package.json file, latest version is 1.1.25:

#### Web

```
"@xaaf/xaaf-web-sdk": "^1.1.25"
```

Add a file called .npmrc in the root folder (next to the package.json file) with the following content:

```bash
@xaaf:registry=http://mavencentral.it.att.com:8081/nexus/repository/npm-advertise/

email=xaaf@intl.att.com

_auth=M19GNE9RUko6aXYxMTg0a3l3NlYtWk44SFFBYzA0SDlvV1lWTjBfa0NQX3NPRlFlUlh3RG8=


proxy=http://emea-chain.proxy.att.com:8080/
https-proxy=http://emea-chain.proxy.att.com:8080/
```

This will use Nexus registry only for dependencies that start with @xaaf and will not impact anything else.

## Step 2 – Place the XaafAd element inside the view hierarchy

```typescript
 <div>
                        id={'xaafVideoElementName'}
                        ref={xaafContainerRef}
                        style={hostVisible === 1 ? styles.removeVideo : styles.videoVisible}
  <div>
```

Notes:

1. "hostVisible" is a boolean host app state variable that is used to toggle between the video and the ad - it is host app responsibility to handle the viability of the video/Ad (there are couple of ways to do that like setting the video/ad style props e.g. hight, opacity, visibility, flex, width etc..).
2. In the example above we use the `xaafVideoElementName` as an id for assigning the div that will populate the XaafAd property.
   The initAd and StartAd receive the xaafAd parameter after its been created with the id of the `xaafVideoElementName` div.

```typescript
const xaafAd = new XaafAd("xaafVideoElementName");
```
3. For using "Squeeze" AD, a container div that will contain the video element ("hostVideo") should be added:

```typescript
<div id="hostVideo" data-ad-extension className={'max-sizes video-container'}>
  <video/>
</div>
```
4. For having full screen abilities, a container div ("divContainerElement") that will contain both the video and the AD should be added, the fullscreen abilities will occur on this div:

```typescript
<div style={styles.viewHost} id="divContainerElement">
<div id="hostVideo" data-ad-extension className={'max-sizes video-container'}>
  <video/>
</div>
<div
  id={xaafVideoElementName}
  ref={xaafContainerRef}
  style={adVisible === 1 ? styles.videoVisible : styles.removeVideo}
  className={'max-sizes ad-container'}
/>
</div>
```
## Step 3 – Initialize an instance of XaafSDK

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

1. SDK initialize method is used to authenticate against the xaaf BE.
2. API*KEY is per platform *–\_ _Please refer to API Keys section_.
3. "xaafInitListener" is an optional event listener.
4. The values of "sdkInitArgs" should be filled according to the table below.

## Step 4 – Get Executable Ad Object

On every ad opportunity, the host app should generate an ExecutableAd Object using the `getExecutableAd` method of the SDK instance.

```typescript
import {
  WebXaafSDK,
  OpportunityType,
  AdEventType,
  AdEvent,
  XaafAd
} from "@xaaf/xaaf-web-sdk";
let xaafSdk = WebXaafSDK.getInstance();
const opportunityInfo: OpportunityInfo = {
  arguments: new Map([
    ["context", "pause"],
    ["hostRequestId", adRequestId], 
    ["opportunityType", "screensaver"]
  ])
};
const executableAd = xaafSdk.getExecutableAd(opportunityInfo);
executableAd.executableAdEventListener = adEvent => {
  if (adEvent.type === AdEventType.Loaded) {
    setTimeout(this.startScreenSaverAd, AD_START_DELAY_HINT);
  }
};
const xad = ExecutableAd;
```

Notes:

1. The values of arguments are optional.
2. `opportunity' – represent the opportunity that is transferred to xaaf BE (for “Screen Saver on Pause experience” the value should be “screensaver” - we recommend to use OpportunityType.PAUSE as imported from "@xaaf/xaaf-web-sdk"'.
3. AD_START_DELAY_HINT – is a constant representing the delay in millisecond until the ad should be displayed after the pause.

### Executable Ads Attributes

```typescript
let xaafSdk = WebXaafSDK.getInstance();
const opportunityInfo = {
  opportunity: OpportunityType.PAUSE,
  arguments: new Map([
    ["context", "pause"],
    ["hostRequestId", adRequestId],
    ["opportunityType", "screensaver"]
  ])
};
const executableAd = xaafSdk.getExecutableAd(opportunityInfo);
const attr = "state";
const attributeValue = executableAd.getAttribute(attr);
```

The valid values for "attr" parameter are:

- _executableAdId_
- _experienceId_
- _adMediaType_
- _state_

## Step 5 – Init Executable Ad

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
  ["hostCCPAEnabled", "true"]
]);
executableAd.initAd(xaafContainerRef, executableAdInitArgs);
```

Notes:

1. "InitAd" method just loads an ad from the server, it doesn`t play it.
2. The "executableAdInitArgs" should be filled in according to the table in the next page.
3. The values of "executableAdInitArg" will override values if also provided in the executableAd creation time (for the same keys).
4. For displaying "Squeeze" AD, "xaafExtension" should be added as a parameter to "initAd" which is the container div of the video ("hostVideo"):
```typescript
    const xaafExtension = new XaafAdExtension("hostVideo");
    xad?.initAd(xaafAd, initAdInfoMapper, xaafExtension);
```

# Host app info parameters table:

The following parameters should be sent by the host app when creating/initializing an Ad.

| **Field name**                | **Field type** | **Expected values**                                                   |
| ----------------------------- | -------------- | --------------------------------------------------------------------- |
| "platform" **(mandatory)**    | String         | Platform type (e.g. dfw)                                              |
| "contentType" **(mandatory)** | String         | The type of the playing asset (vod, live, recorded, rtvod)            |
| "deviceType" **(mandatory)**  | String         | The type of the device (e.g. firetv/tvos/roku/osprey)                 |
| "deviceAdId"                  | String         | Device advertising ID                                                 |
| "userAdvrId"                  | String         | Partner profile ID                                                    |
| "fwSUSSId"                    | String         | Same as "userAdvrId"                                                  |
| "householdid"                 | String         | Same as "userAdvrId"                                                  |
| "deviceAdvrId"                | String         | Device advertising ID                                                 |
| "userType"                    | String         | 2                                                                     |
| "deviceFWAdId"                | String         | Nielsen - device ad id                                                |
| "networkName"                 | String         | The name of the network (e.g. abc)                                    |
| "channelId"                   | String         | CCID                                                                  |
| "channelName"                 | String         | The name of the channel (e.g. ESPN) if available                      |
| "programName"                 | String         | The name of the program (e.g. game_of_thrones)                        |
| "programmerName"              | String         | The name of the programmer (e.g. Disney)                              |
| "tenantName"                  | String         | directv                                                               |
| "isDuringAd"                  | String         | True/False                                                            |
| "appName"                     | String         | ov/wtv/dtv                                                            |
| "appVersion"                  | String         | e.g. 1.0.103                                                          |
| "expType"                     | String         | out_of_stream / in_stream                                             |
| "opportunityType"             | String         | screensaver                                                           |
| "context"                     | String         | pause                                                                 |
| "adStartDelayHint"            | String         | Expected delay time form ad_init to ad_start trigger, in milliseconds |
| "hostCCPAEnabled"             | String         | Host decide regarding CCPA. true/false                                |

## Step 5 – play / start ad

‘xaafContainerRef’ - Reference to the xaaf-ad component.

```typescript
executableAd.startAd(this.xaafAd);
this.hostVisible = false;
```

## Step 6 – stop / hide ad

```typescript
this.hostVisible = true;
executableAd?.stopAd();
this.createExecutableAd();
```

Note: it is recommended to create another Ad instance just after stopAd.

## API Keys

The host app should have a logic and transfer to the SDK initilize

# Host app info parameters table:

The following parameters should be sent by the host app when creating/initializing an Ad.

| **Tenant** | **App**    | **Device** | **Key**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ---------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DIRECTV    | DIRECTVNOW | firetv     | eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVkMzg5OG RmY2M0MzI2MDAxOTJmNzRjZiIsImFwcElkIjoiNWQzODk4ZGZjYzQzMjY wMDE5MmY3NGQwIiwicGxhdGZvcm1OYW1lIjoiZmlyZXR2LXlvdWkiLCJz ZGtWZXJzaW9uIjoidjEiLCJzZGtOYW1lIjoianMtc2RrLXlvdWkiLCJlbmFibGV kIjp0cnVlLCJob3N0IjoiaHR0cHM6Ly94YWFmLWJlLWxpdmUuYXR0LmNv bSIsImVudmlyb25tZW50IjoieGFuZHItcHJvZC1saXZlIiwiaWF0IjoxNTg1Nz Q5NDU1LCJpc3MiOiJBVCZUIiwic3ViIjoiQXBpS2V5In0.O6n6Rlj4_uxjTAw nGPDSQq-KiPSlsin_tOT4wSXfi44iJJOOv9hlApexOfwcCRSunyHehouQ3xaN3VWQ5t05xoxLkvSWA-OrH-DZtWdPDoEA-sWJxg79exeTKwksoumVzzcECszF6eNuXc5h1s8MsY_HlW9ZPXj9v8T2gy3 jFvKbuIo6wYlAvZ5gQaR46tPOxVqIJYg2Ejqy38kDef9EanuqriRsdk5afcVCn uhg3ObPMSUW3l_8eFznGmJhLbGcVPSfw4OmN93vJEIDyWyGqGfBcCH_8qKA52AjVkhXvviDxTN87Iqc_DRDzcmPpCRv0O5sfNEbdXMxBeZG2oR5g    |
| DIRECTV    | DIRECTVNOW | tvos       | eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVkMzg5OG RmY2M0MzI2MDAxOTJmNzRjZiIsImFwcElkIjoiNWQzODk4ZGZjYzQzMjY wMDE5MmY3NGQwIiwicGxhdGZvcm1OYW1lIjoiYXBwbGV0di15b3VpIi wic2RrVmVyc2lvbiI6InYxIiwic2RrTmFtZSI6ImpzLXNkay15b3VpIiwiZW5h YmxlZCI6dHJ1ZSwiaG9zdCI6Imh0dHBzOi8veGFhZi1iZS1saXZlLmF0dC5jb20iLCJlbnZpcm9ubWVudCI6InhhbmRyLXByb2QtbGl2ZSIsImlhdCI6MTU4 NTc0OTQ1NiwiaXNzIjoiQVQmVCIsInN1YiI6IkFwaUtleSJ9.P1PXrUh3peRR qD3Q5J5S4OG8mUMVVjvCAHAA1EAXbi5_IQTC_8sTFmBtlKQDaMmabK VKA9EhtJnUm77J696logjaoxJ1eExCLCTY1wGOAU0QwiZuXg5D3gUUXZS RbLFdiDPJPuzTTrlZ9Dhg9IXO-zCxuYxUyBHyT6zn4IVbLOap5f2Ggk0L4Wv32zhcFod4gjOStLDQHmvBpMl u-lB-fNAArhaIGmzgbfnFkN1ODvZQuSfGcmy_QXAux_V-rv6pokyBertLS7sCkM3AhaDjFpL9GYhqFzCwdJteoeoCZsl3olR35OjNz8sJA CxEIxpipdpBBjgvKZflWxgtuhFQDQ |
