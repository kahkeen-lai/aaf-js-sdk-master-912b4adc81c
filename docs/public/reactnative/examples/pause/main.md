## Screen Saver on Pause

### step by step integration guide

When the user pauses the video playback, a possible experience could be the **Xandr Screen Saver** on Pause experience, which displays a translucent video ad on top of the paused video frame.

The client has full control and may choose to close the ad following any user interaction, or for any other reason.

**Step 1** – Import XAAF SDK  
Add or edit a file called `.npmrc` in the root folder (next to the package.json file) with the following content:

```bash
@xaaf:registry=http://mavencentral.it.att.com:8081/nexus/repository/npm-advertise/ email=xaaf@intl.att.com   _auth=M19GNE9RUko6aXYxMTg0a3l3NlYtWk44SFFBYzA0SDlvV1lWTjBfa0NQX3NPRlFlUlh3RG8=
```

This will use Nexus registry only for dependencies that start with `@xaaf` and will not impact anything else.

Then go ont and install the packages

```
yarn add @xaaf/aaf-rn-sdk
npm i @xaaf/aaf-rn-sdk
```

**Step 2** – Place the XaafAd element inside the view hierarchy

```typescript
import { XaafAd } from "@xaaf/aaf-rn-sdk";
renderVideo = () => {
  return (
    <View>
      <Video
        ref={this.setPlayer}
        style={showAd ? styles.removeVideo : styles.showVideo}
      />
      <XaafAd
        ref={this.setXaafPlayer}
        style={showAd ? styles.showVideo : styles.removeVideo}
      >{({
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

1. `showAd` is a boolean host app state variable that is used to toggle between the video and the ad - it is host app responsibility to handle the viability of the video/Ad (there are couple of ways to do that like setting the video/ad style props e.g. hight, opacity, visibility, flex, width etc..).

2. In the example above we use the `setXaafPlayer` as method for assigning the inner `xaafContainerRef` property, the `xaafContainerRef` will be later sent to the `startAd` and `initAd` as the element.

```typescript
setXaafPlayer = (ref) => {
  this.xaafContainerRef = ref;
};
```

**Step 3** – Initialize an instance of Xaaf SDK

```typescript
import { XaafAd, YouIXaafSDK } from "@xaaf/aaf-rn-sdk";
const sdkInitArgs = new Map([
  ["platform", "dfw"],
  ["deviceType", "tvos"],
  ["deviceAdId", "0"],
  ["userAdvrId", "0"],
  ["fwSUSSId", "0"],
  ["householdId", "0"],
  ["deviceAdvrId", "0"],
  ["userType", "2"],
  ["deviceFWAdId", "0"],
  ["tenantName", "directv"],
  ["appName", "ov"],
  ["appVersion", "1.0.103"],
]);
const sdk = YouIXaafSDK.getInstance();
sdk.xaafInitListener = (xaafEvent) => {
  // use events as needed from xaafEvent
};
sdk.initialize(API_KEY, sdkInitArgs);
```

Notes:

1. SDK initialize method is used to authenticate against the xaaf BE.
2. API_KEY is per platform – Please refer to API Keys section.
3. `xaafInitListener` is an optional event listener.
4. The values of `sdkInitArgs` should be filled according to the table below.

> From version 1.0.41 - You can get the version of the SDK by using get function `xaafSdkVersion`.

**Step 4**

Get Executable Ad Object  
 On every ad opportunity, the host app should generate an ExecutableAd Object using the `getExecutableAd` method of the SDK instance.

```typescript
import { OpportunityType, XaafAd, YouIXaafSDK } from "@xaaf/aaf-rn-sdk";
const executableAdCreationArgs = new Map([["context", "pause"]]);
const sdk = YouIXaafSDK.getInstance();
const opportunityInfo = {
  opportunity: OpportunityType.PAUSE,
  arguments: executableAdCreationArgs,
};
const executableAd = sdk.getExecutableAd(opportunityInfo);
executableAd.executableAdEventListener = (adEvent) => {
  if (adEvent.type === "Loaded") {
    setTimeout(this.startScreenSaverAd, AD_START_DELAY_HINT);
  }
};
this.setState({ executableAd: executableAd });
```

Notes:

1. The values of `executableAdCreationArgs` are optional.
2. `opportunity' – represent the opportunity that is transferred to xaaf BE (for “Screen Saver on Pause experience” the value should be “screensaver” - we recommend to use OpportunityType.PAUSE as imported from '@xaaf/aaf-rn-sdk'.
3. AD_START_DELAY_HINT – is a constant representing the delay in millisecond until the ad should be displayed after the pause.

Executable Ads Attributes

```typescript
const sdk = YouIXaafSDK.getInstance();
const opportunityInfo = {
  opportunity: OpportunityType.PAUSE,
  arguments: executableAdCreationArgs,
};
const executableAd = sdk.getExecutableAd(opportunityInfo);
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
import { OpportunityType, XaafAd, YouIXaafSDK } from "@xaaf/aaf-rn-sdk";
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
executableAd.startAd(this.xaafContainerRef);
this.setState({ showAd: true });
```

**Step 7** – stop / hide ad

```typescript
this.setState({ showAd: false });
executableAd?.stopAd();
this.createExecutableAd();
```

> Note: it is recommended to create another Ad instance just after stopAd.
