## Introduction

The XandrAdvertising Application Framework (XAAF) enables interactive and enriched ad experiences. This document is a guide for a hands-on integration of the XAAF SDK.

## Executable Ad

The Executable Ad represents the lifecycle of an ad. When the host client determines there is an appropriate ad opportunity, it requests an ad from the SDK, while passing the type of an opportunity (e.g. screen saver). The SDK will create the matching executable ad instance. The executable ad handles the ad experience and its rendering, within a container view provided by the host client.

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

### When to create an Ad

In general, we recommend creating an executable ad when advertisement opportunity is recognized. For Screen Saver on Pause opportunity this will be when stream playback is prepared, and basic asset attributes are known.
In addition, we suggest creating an ad immediately after the previous one finished its execution (to support more than one Screen Saver Ad during the same asset playback). Application can create as many executable ads as it finds necessary, but only one ad at a time should be initialized and started.
`getExecutableAd` method of the sdk instance is used to create a new Ad.

```typescript
   getExecutableAd(opportunityInfo: OpportunityInfo): ExecutableAd;
```

Input: OpportunityInfo object should be used as input to the getExecutableAd function.

The OpportunityInfo contains:

> `opportunity` – represent the opportunity that is transferred to xaaf BE (for “Screen Saver on Pause experience” the value should be “screensaver” - we recommend to use OpportunityType.PAUSE as imported from '@xaaf/aaf-rn-sdk'.

> `arguments` – a map with additional info – currently no additional data is required.

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

> Executable ad notifies its hosting application about its lifecycle events. To get these notifications, the hosting application should assign the appropriate event observer / listener.
