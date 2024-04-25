### When to initialize an Ad

The Screen Saver ad must be initialized before it can be displayed. It should be done when the playback is paused by using `initAd` method.

```javascript
initAd(el: XaafElement, initAdinfo: Map<string, string>): Promise<ExitCode>;
```

Input:   

1. ‘el’ - Reference to the xaaf-ad component.   
2. ‘initAdinfo’ - Map with additional data to pass – mandatory and optional data. For detailed parameter types and values see table below.
 
