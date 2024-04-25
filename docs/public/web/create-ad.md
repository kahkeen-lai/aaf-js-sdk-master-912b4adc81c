### When to create an Ad

In general, we recommend creating an executable ad when advertisement opportunity is recognized. For Screen Saver on Pause opportunity this will be when stream playback is prepared, and basic asset attributes are known.
In addition, we suggest creating an ad immediately after the previous one finished its execution (to support more than one Screen Saver Ad during the same asset playback). Application can create as many executable ads as it finds necessary, but only one ad at a time should be initialized and started.
`getExecutableAd` method of the sdk instance is used to create a new Ad.

``` typescript
 const executableAd: any = sdkContext.getExecutableAd(opportunityInfo);
```

Input: OpportunityInfo object should be used as input to the getExecutableAd function.

The OpportunityInfo contains:

> `opportunity` – represent the opportunity that is transferred to xaaf BE (forScreen Saver on Pause experience the value should be “screensaver” - we recommend to use OpportunityType.PAUSE as imported from @xaaf/xaaf-web-sdk.

> `arguments` – a map with additional info – currently no additional data is required.

The following is the ‘OpportunityType’ enum and ‘OpportunityInfo’ interface:

```typescript
   enum OpportunityType {
         PAUSE = "screensaver", 
         CREDITS = "squeeze"
   }
   interface OpportunityInfo {     opportunity: OpportunityType;     arguments: Map<string, string>;   }
```

> Executable ad notifies its hosting application about its lifecycle events. To get these notifications, the hosting application should assign the appropriate event observer / listener.