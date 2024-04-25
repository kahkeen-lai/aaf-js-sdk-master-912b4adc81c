The “xaaf-ad” component

The xaaf-ad component is an HTML video element that represents an Ad.
It should be placed inside the view hierarchy with assigned reference to it.
The id variable should later be used as an input to the executable Ad APIs.
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


