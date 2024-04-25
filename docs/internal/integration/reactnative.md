## Introduction

The XandrAdvertising Application Framework (XAAF) enables interactive and enriched ad experiences. This document is a guide for a hands-on integration of the XAAF SDK.

## Executable Ad

The Executable Ad represents the lifecycle of an ad. When the host client determines there is an appropriate ad opportunity, it requests an ad from the SDK, while passing the type of an opportunity (e.g. screensaver). The SDK will create the matching executable ad instance. The executable ad handles the ad experience and its rendering, within a container view provided by the host client.

At the appropriate time, the host client will control the executable ad via its life cycle methods. The executable ad will publish events to the hosting app, notifying it about user interactions and rendering progress.

# XAAF integration guide for You.i JS SDK

## The xaaf-ad component

The xaaf-ad component is a You.i element that represent an Ad.

It should be placed inside the view hierarchy with assigned reference to it.

The reference (ref) variable should later be used as an input to the executable Ad APIs.

Example of xaaf-ad component that should be placed into the view hierarchy:

```
<XaafAd ref={this.setXaafPlayer} style={ showAd ? styles.showVideo : styles.removeVideo}>{({
                  bufferLength,
                  onBufferingEnded,
                  onBufferingStarted,
                  onCurrentTimeUpdated,
                  onDurationChanged,
                  onErrorOccurred,
                  onFinalized,
                  onPaused,
                  onPlaybackComplete,
                  onPlaying,
                  onPreparing,
                  onReady,
                  onStateChanged,
                  source,
                  ...rest
                }: VideoPlayerProps) => (
                  <XaafVideoPlayer
                    // @ts-ignore
                    ref={ref}
                    controls={false}
                    style={videoStyles.video}
                    onReady={onReady}
                    onBufferingEnded={onBufferingEnded}
                    onBufferingStarted={onBufferingStarted}
                    onCurrentTimeUpdated={onCurrentTimeUpdated}
                    onDurationChanged={onDurationChanged}
                    onErrorOccurred={onErrorOccurred}
                    onFinalized={onFinalized}
                    onPaused={onPaused}
                    onStateChanged={onStateChanged}
                    onPlaybackComplete={onPlaybackComplete}
                    onPlaying={onPlaying}
                    onPreparing={onPreparing}
                    bufferLength={bufferLength}
                    source={source}
                    {...rest}
                  />
                )}</XaafAd>
```

In the example above we use the setXaafPlayer as method for assigning the inner ‘xaafContainerRef’ property.

```typescript
setXaafPlayer = (ref) => {
  this.xaafContainerRef = ref;
};
```

## When to create an Ad

In general, we recommend creating an executable ad when advertisement opportunity is recognized.

- For Screen Saver on Pause opportunity this will be when stream playback is prepared, and basic asset attributes are known. In addition, we suggest creating an ad immediately after the previous one finished its execution (to support more than one Screen Saver Ad during the same asset playback). Application can create as many executable ads as it finds necessary, but only one ad at a time should be initialized and started.
- For Binge Ad opportunity this will be when starting binge watch. This experience should be self-dismissed. There are 3 steps:
  - First "preroll" full screen image should be presented when starting binge watch, before the first episode starts
  - "midroll" full screen image should be presented after the first episode/before the second
  - "postroll" image should be presented after the third episode.

‘getExecutableAd’ method of the sdk instance is used to create a new Ad.

```typescript
getExecutableAd(opportunityInfo: OpportunityInfo): ExecutableAd;
```

**Input:**

OpportunityInfo object should be used as input to the _getExecutableAd_ function.

The OpportunityInfo contains:

- opportunity – represent the opportunity that is transferred to xaaf BE (for Screen Saver on Pause experience the value should be "screensaver" - we recommend to use OpportunityType.PAUSE as imported from @xaaf/aaf-rn-sdk.
- "arguments"– a map with additional info
  - one of the entries is the opportunityType (represents the kind of opportunity, it can be "screensaver", "binge", etc ...).
    In case of binge, the following entries should also be added in the arguments map: - "bingeAdStep" - preroll / midroll / postroll - "episodeName" - "episodeNumber" - "seasonName" - "seasonNumber"

The following is the ‘OpportunityType’ enum and ‘OpportunityInfo’ interface:

```typescript
enum OpportunityType {
  PAUSE = "screensaver",
  CREDITS = "squeeze",
}

interface OpportunityInfo {
  opportunity: OpportunityType;
  arguments: Map<string, string>;
}
```

- Executable ad notifies its hosting application about its lifecycle events. To get these notifications, the hosting application should assign the appropriate event observer / listener.

## When to initialize an Ad

- Screen Saver ad - initialization must be done before it can be displayed. It should be done when the playback is paused by using "initAd" method.
- Binde Ad - initAd should be called immediately after creating the executableAd.

```properties
initAd(el: XaafElement, initAdinfo: Map<string, string>): Promise<ExitCode>;
```

**Input:**

1. el - Reference to the xaaf-ad component.
2. initAdinfo - Map with additional data to pass – mandatory and optional data.

For detailed parameter types and values see table below.

## When to start an Ad

- Screen Saver Ad should be started when the ad playback is desired by using "startAd" method
- Binge Ad should be started once the ad is loaded by using "startAd" method

```properties
startAd(el: XaafElement): void;
```

"el" – the same reference used in initAd method.

We recommend allowing a couple of seconds (configurable) of delay before starting an ad after user selected to pause the content playback, to ensure that user does not intend to resume the playback immediately or perform any other action. Similarly, any interaction with remote control should delay the ad beginning. If no interaction with remote was detected for the specified interval, then the ad can be started.
It is required that the delay time will be transferred as one of the params to ‘initAd’ method with key named “adStartDelayHint” see table below.

## When to stop an Ad

- Screen Saver Ad will stay on the screen until stopped. The decision to stop the ad is up to the hosting application. We recommend stopping the Screen Saver Ad when the user interacts with remote control, when new asset is selected or when the application is suspended to the background.
- Binge Ad will be self-dismissed

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

Add the following dependency to the package.json file:

#### react native

```
@xaaf/aaf-rn-sdk
```

Add a file called .npmrc in the root folder (next to the package.json file) with the following content:

```bash
@xaaf:registry=@xaaf:registry=https://npm-resources.cld.dtveng.net/
```

This will use Nexus registry only for dependencies that start with @xaaf and will not impact anything else.

## Step 2 – Place the XaafAd element inside the view hierarchy

```typescript
import { XaafAd } from '@xaaf/aaf-rn-sdk';

renderVideo = () => {
      ...
  return (
    <View>
      <Video
        ref={this.setPlayer}
        style={showAd ? styles.removeVideo : styles.showVideo}
           ...
      />
        <XaafAd ref={this.setXaafPlayer} style={showAd ? styles.showVideo : styles.removeVideo}>{({
                  bufferLength,
                  onBufferingEnded,
                  onBufferingStarted,
                  onCurrentTimeUpdated,
                  onDurationChanged,
                  onErrorOccurred,
                  onFinalized,
                  onPaused,
                  onPlaybackComplete,
                  onPlaying,
                  onPreparing,
                  onReady,
                  onStateChanged,
                  source,
                  ...rest
                }: VideoPlayerProps) => (
                  <XaafVideoPlayer
                    // @ts-ignore
                    ref={ref}
                    controls={false}
                    style={videoStyles.video}
                    onReady={onReady}
                    onBufferingEnded={onBufferingEnded}
                    onBufferingStarted={onBufferingStarted}
                    onCurrentTimeUpdated={onCurrentTimeUpdated}
                    onDurationChanged={onDurationChanged}
                    onErrorOccurred={onErrorOccurred}
                    onFinalized={onFinalized}
                    onPaused={onPaused}
                    onStateChanged={onStateChanged}
                    onPlaybackComplete={onPlaybackComplete}
                    onPlaying={onPlaying}
                    onPreparing={onPreparing}
                    bufferLength={bufferLength}
                    source={source}
                    {...rest}
                  />
                )}</XaafAd>
    </View>
  );
};
```

Notes:

1. "showAd" is a boolean host app state variable that is used to toggle between the video and the ad - it is host app responsibility to handle the viability of the video/Ad (there are couple of ways to do that like setting the video/ad style props e.g. hight, opacity, visibility, flex, width etc..).
2. In the example above we use the "setXaafPlayer" as method for assigning the inner
   "xaafContainerRef" property, the "xaafContainerRef" will be later sent to the ‘startAd’ and ‘initAd’ as the element.

```typescript
setXaafPlayer = (ref) => {
  this.xaafContainerRef = ref;
};
```

## Step 3 – Initialize an instance of XaafSDK

```typescript
import { XaafAd, YouIXaafSDK } from'@xaaf/aaf-rn-sdk';

constsdkInitArgs = newMap([

  ['platform';, ';dfw'],

  ['deviceType', 'tvos'],

  ['deviceAdId', '0'],

  ['userAdvrId', '0'],

  ['fwSUSSId', '0'],

  ['householdId', '0'],

  ['deviceAdvrId', '0'],

  ['userType', '2'],

  ['deviceFWAdId', '0'],

  ['tenantName', 'directv'],

  ['appName', 'ov'],

  ['appVersion', '1.0.103'],

  ['appMode', 'debug'/'release'],

]);

const sdk = YouIXaafSDK.getInstance();

sdk.xaafInitListener = (xaafEvent) =\&gt; {

  // use events as needed from xaafEvent

};

sdk.initialize(API_KEY, sdkInitArgs);
```

1. SDK initialize method is used to authenticate against the xaaf BE.
2. API*KEY is per platform *–\_ _Please refer to API Keys section_.
3. "xaafInitListener" is an optional event listener.
4. The values of "sdkInitArgs" should be filled according to the table below.

## Step 4 – Get Executable Ad Object

On every ad opportunity, the host app should generate an _ExecutableAd_ Object using the "getExecutableAd" method of the SDK instance.

```typescript
import { OpportunityType, XaafAd, YouIXaafSDK } from"@xaaf/aaf-rn-sdk";

constexecutableAdCreationArgs = newMap([

  ["context", "pause"],
  ["opportunityType", "screensaver"]

]);

constsdk = YouIXaafSDK.getInstance();

const opportunityInfo = {

  opportunity:OpportunityType.PAUSE,

  arguments:executableAdCreationArgs
};

constexecutableAd = sdk.getExecutableAd(opportunityInfo);

executableAd.executableAdEventListener = (adEvent) =\&gt; {

  if (adEvent.type === &Loaded&) {

    setTimeout(this.startScreenSaverAd, AD\_START\_DELAY\_HINT);

  }

};

this.setState({ executableAd:executableAd });
```

Notes:

1. The values of "executableAdCreationArgs" are optional.
2. "opportunity" – represent the opportunity that is transferred to xaaf BE (for &Screen Saver on Pause experience the value should be &screensaver- we recommend to use OpportunityType.PAUSE as imported from "@xaaf/aaf-rn-sdk".
3. AD_START_DELAY_HINT – is a constant representing the delay in millisecond until the ad should be displayed after the pause.

### Executable Ads Attributes

```typescript
constsdk = YouIXaafSDK.getInstance();

const opportunityInfo = {
  opportunity: OpportunityType.PAUSE,

  arguments: executableAdCreationArgs,
};

constexecutableAd = sdk.getExecutableAd(opportunityInfo);

constattr = "state";

constattributeValue = executableAd.getAttribute(attr);
```

The valid values for "attr" parameter are:

- _executableAdId_
- _experienceId_
- _adMediaType_
- _state_

## Step 5 – Init Executable Ad

```typescript
import { OpportunityType, XaafAd, YouIXaafSDK } from"@xaaf/aaf-rn-sdk";

constSECOND = 1000;

constAD\_START\_DELAY\_HINT = 30 \* SECOND;

constexecutableAdInitArgs = newMap([

  ["networkName", "abc"],

  ["isDuringAd", "true"],

  ["channelName", "espn"],

  ["programmerName", "disney"],

  ["adStartDelayHint"], [AD\_START\_DELAY\_HINT],

  ["expType", "out\_of\_stream"],

  ["contentType", "vod"],

  ["channelId", "12345"],

  ["programName", "game\_of\_throne"],

  ["hostCCPAEnabled", "true"]

]);

executableAd.initAd(xaafContainerRef, executableAdInitArgs)
```

Notes:

1. "InitAd" method just loads an ad from the server, it doesn"t play it.
2. The "executableAdInitArgs" should be filled in according to the table in the next page.
3. The values of "executableAdInitArgs" will override values if also provided in the executableAd creation time (for the same keys).

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

"xaafContainerRef" - Reference to the xaaf-ad component.

```typescript
executableAd.startAd(this.xaafContainerRef);

this.setState({ showAd: true });
```

## Step 6 – stop / hide ad

```typescript
this.setState({ showAd: false });

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
