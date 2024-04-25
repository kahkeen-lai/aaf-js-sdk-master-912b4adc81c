### When to start an Ad

The Screen Saver Ad should be started when the ad playback is desired by using `startAd` method:

```typescript
  xad?.startAd(xaafAd);
```

`xad` – the same reference used in `initAd` method.

We recommend allowing a couple of seconds (configurable) of delay before starting an ad after user selected to pause the content playback, to ensure that user does not intend to resume the  playback immediately or perform any other action. Similarly, any interaction with remote control should delay the ad beginning. 

> If no interaction with remote was detected for the specified interval, then the ad can be started.

> It is required that the delay time will be transfared as one of the params to `initAd` method with key named `adStartDelayHint` see table below.

