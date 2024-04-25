### When to stop an Ad   
The Screen Saver Ad will stay on the screen until stopped. The decision to stop the ad is up to the hosting application. We recommend stopping the Screen Saver Ad when the user interacts with remote control, when new asset is selected or when the application is suspended to the background.   
```typescript
stopAd(): void;
```
From version 1.1.8 the host app can pass reason string when stopping the Ad. 
 
### When to release an Ad   
We recommend releasing an ad instance (to nullify its reference) when the hosting client receives adStopped or adError event.   