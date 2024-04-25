The “xaaf-ad” component

The xaaf-ad component is a **You.i** element that represent an Ad. It should be placed inside the view hierarchy with assigned reference to it. The reference **(ref)** variable should later be used as an input to the executable Ad APIs.
Example of xaaf-ad component that should be placed into the view hierarchy:

```
<XaafAd ref={this.setXaafPlayer} style={ showAd ? styles.showVideo : styles.removeVideo}></XaafAd>

```

In the example above we use the ‘setXaafPlayer’ as method for assigning the inner ‘xaafContainerRef’ property

```
   setXaafPlayer = ref => {       this.xaafContainerRef = ref;       };
```


