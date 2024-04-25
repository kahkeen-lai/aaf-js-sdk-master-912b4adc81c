## Introduction
The XandrAdvertising Application Framework (XAAF) enables interactive and enriched  ad experiences. This document is a guide for a hands-on integration of the XAAF SDK.

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

