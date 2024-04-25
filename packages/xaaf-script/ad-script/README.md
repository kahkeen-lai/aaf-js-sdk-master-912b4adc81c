# Welcome to Ad-Script - the ad DSL.

<!-- tabs:start -->
#### ** Reference **

[filename](globals.md ':include')

#### ** Bundle analysys **

[treemap](bundle.treemap.stats.html ':include :type=iframe width=100% height=800px')

#### ** Tests overview **

[tests](tests.html ':include :type=iframe width=100% height=100%')
<!-- tabs:end -->


## command data structure
```
-- Root
  |- xaaf
    |- events
    |- methods
    |- templates
  |- props
  |- children
```


## Language support $ Functions


## Definitions
```JSON
  "xaaf": {
          "events": [{ "action": "Loaded", "name": "#checkIsShoppable" }],
          "methods": {
            "checkIsShoppable": {
              "input": ["media_item_id"],
              "flow": [
                {
                  "$set": {
                      "name": "@apiUrlWithParams",
                      "value": {
                        "$replace": {
                          "from": "https://jsonplaceholder.typicode.com/users",
                          "replace": "@paramId",
                          "value": "media_item_id"
                        }
                      }
                    
                  }
                },
                {
                  "$getData": {
                    "source": "@apiUrlWithParams",
                    "target": "@apiResponse"
                  }
                },
                {
                  "$set": {
                      "name": "@apiTempred",
                      "value": "@apiResponse"
                  }
                }
              ]
            },
            "renderProductsList": {
              "input": ["targetElement"],
              "flow": [
                {
                  "$renderView": {
                    "templateName": "products",
                    "appendTo": "targetElement",
                    "data": [
                      {
                        "name": "iphone",
                        "price": "5",
                        "url": "https://www.amazon.com/Instant-Pot-Duo-Evo-Plus/",
                        "image": "data:image/webp;base64,UklGRhQeAABXRUJQVlA4IAgeAACwmQCdASoXASwBPrFMnUmkIieopRNM8R"
                      },
                      {
                        "name": "samsung",
                        "price": "50",
                        "image": "https://offautan-uc1.azureedge.net/-/media/images/off/ph/products-en/products-landing/landing/off_kids_product_collections_large_2x.jpg?la=en-ph"
                      },
                      {
                        "name": "iphone",
                        "price": "5",
                        "image": "https://offautan-uc1.azureedge.net/-/media/images/off/ph/products-en/products-landing/landing/off_overtime_product_collections_large_2x.jpg?la=en-ph"
                      },
                      {
                        "name": "samsung",
                        "price": "50",
                        "image": "https://offautan-uc1.azureedge.net/-/media/images/off/ph/products-en/products-landing/landing/off_kids_product_collections_large_2x.jpg?la=en-ph"
                      },
                      {
                        "name": "samsung",
                        "price": "50",
                        "image": "https://offautan-uc1.azureedge.net/-/media/images/off/ph/products-en/products-landing/landing/off_kids_product_collections_large_2x.jpg?la=en-ph"
                      }
                    ]
                  }
                }
              ]
            },
            "openUrl": {
              "input": ["url"],
              "flow": [
                {
                  "$openUrl": {
                    "url": "url"
                  }
                }
              ]
            }
          },
          "templates": {
            "products": {
              "type": "img",
              "xaaf": {
                "events": [
                  {
                    "action": "Clicked",
                    "name": "#openUrl",
                    "args": { "url": "@url" }
                  }
                ]
              },
              "props": {
                "title": "@name",
                "style": {
                  "float": "right",
                  "width": "50px",
                  "height": "50px",
                  "margin": "20px"
                },
                "src": "@image"
              }
            }
          }
        },
```

```
{
  "methods": MethodsObject
}
```
## Methods





### $set
Set a variable with a value
```json
"$set": {
      "name": "@apiUrlWithParams"
      "value": "http://apirest/get-something?param=5"
  }
```

### $get
Get a variable with a value, can be nested in other methods
```json
"$get": {
      "name": "@apiUrlWithParams"
  }
```

### $replace
Replace a part of a string with another (single replace)
```json
"$replace": {
    "from": "http://apirest/get-something?param=@paramId",
    "replace": "@paramId",
    "value": "@media_item_id"
  }
```


### $choose
Similar to switch keyword
```json
"$choose": {
    "value": "@media_item_id",
    "cases": {
      "5": [
        {
          "$set": {
              "name": ""@from_switch",
              "value": "data from switch 5"
          }
        }
      ],
      "1": [
        {
          "$set": {
              "name": "@from_switch",
              "value": "data from switch 1"
          }
        }
      ]
    }
  }
```

### $condition
Similar to If statement
```json
 "$condition": {
    "value": "@media_item_id",
    "conditions": [
      {
        "@media_item_id": {
          "gte": 5 // opretors eq,not,gt,gte,lt,lte
        },
        "logic":"and" // "or"
      },
      {
        "@media_item_id": {
          "lt": 65
        }
      }
    ],
    "true": [
      {
        "$set": {
            "name": "@apiUrlWithParams",
            "value": "http://apirest/get-something?param=65"
        }
      }
    ],
    "false": [
      {
        "$set": {
            "name": "@apiUrlWithParams",
            "value": "http://apirest/get-something?param=5"
        }
      }
    ]
  }
```
### $getData
Perform a get request over http to the `source` and place the data in the variable `target`
```json
 "$getData": {
      "source": "@apiUrlWithParams",
      "target": "@apiResponse"
  }
```
### $renderView
```json
"$renderView": {
      "templateName": "5product_view",
      "data": "@apiResponse"
  }
```

