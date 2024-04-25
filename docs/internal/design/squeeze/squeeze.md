## Squeeze BB

### Motivation

XAAF’s vision is to have a squeeze BB that will be available at predefined opportunity times, such as credits, low interest points, etc.
The Squeeze BB will allow to squeeze the host content, to any location, and size. The squeezed element can be predefined with border and margin attributes, and duration of the squeeze animation can be set as well.

> **_NOTE:_** Only the host content view be squeezed, any UI Elements/overlays on/it it should stay as is.

### Epic Details
- [Epic Link](https://itrack.web.att.com/browse/ADVERTISE-7013)
- Demo - TBD.
- Epic Owner - [Ziv Zalzstein](mailto:ziv.zalzstein@intl.att.com)

### Overview

#### Squeeze Element
Attributes related to the squeezed/unsqueezed element, such as border, margin, will be modified indirectly, via a `View` wrapping the `Host View`.
Squeeze Animation functionality will be implemented in the squeeze element, will the data such as duration, scaling, position

##### Squeeze Element Interface

```typescript
import { BaseXaafElement } from './elements';

export interface XaafSqueezeData {
    duration: number;
    videoScale: VideoScale;
    backgroundColor?: string;
    videoMargin: VideoMargin;
    videoBorder: VideoBorder;
}

export interface VideoScale {
    scale_x: number;
    scale_y: number;
    pivot_x: number;
    pivot_y: number;
}

export interface VideoMargin {
    left: string;
    top: string;
    right: string;
    bottom: string;
}

export interface VideoBorder {
    state: BorderState;
    mode: BorderMode;
    width?: string;
    color?: string;
    style?: string;
}

export enum BorderState {
    show = 'SHOW',
    hide = 'HIDE'
}

export enum BorderMode {
    pre = 'PRE',
    completed = 'COMPLETED'
}

export interface XaafSqueezeElement extends BaseXaafElement<XaafSqueezeListener, XaafSqueezeData> {
    squeeze(): void;
    unsqueeze(): void;
}

export interface XaafSqueezeListener {
    onError(error: SqueezeError): void;
    onSqueezeStarted(): void;
    onSqueezeEnded(): void;
}

export interface SqueezeError {
    message: string;
    errorEndPoint: string;
}
```

#### XiP
##### SHOW_VIDEO command:
- zOrder - will be added to videoData with "background"/"foreground" values, so we'll be able to control the hierarchy of the ad, whereas "background" will be the default and will position the ad behind the host view.

##### Squeeze command:
The squeeze command will include the following data:
- duration (milliseconds) - will specify the duration of the squeeze/un-squeeze animation.

- videoScale - a structure that will contain:
  - scale_x, scale_y - for scaling specification of the squeezed view in x and y axis.
  - pivot_x, pivot_y (range: (0,1)) - for position-ing the squeezed element, whereas ({ pivot_x: 0, pivot_y: 0}) refers to the topLeft corner, and ({pivot_x: 1, pivot_y: 0}) refers to the topRight corner.


- videoMargin - a structure that will define the margin of the squeezed element, using the following fields:
  - left
  - top
  - right
  - bottom


- videoBorder - a structure the will define the characteristics of the `Host View` border.
  - state: "show"/"hide" that will define whether the border will be displayed or not.
  - mode: "pre"/"completed" that will define whether the border styling will be applied before (i.e., `"pre"`) the command is triggered or after the command is completed (i.e., `"completed"`)
  - width: will define the `borderWidth` in case the state will be "show".
  - color: will define the `borderColor` in case the state will be "show".

##### Triggers in XiP
In order to achieve the execution of the squeeze command, actions related to "SHOW_VIDEO", such as `"PLAY/STOP"`, reporting related info, or moving to error state, a mechanism of `fireTriggers` that will be added to the command structure will play apart, as well as the mechanism of `ACTION_COMMAND`.

#### XIP examples
##### Squeeze command with SHOW_VIDEO

```JSON
{
  "_id": "5dd51db9e3b6870008c4d7d8",
  "experienceId": "f77bafc7-8a41-400b-acd8-002bcd6dacf4",
  "experienceMediaType": "Squeeze commands",
  "commands": [
    {
      "id": 1,
      "commandName": "SHOW_VIDEO",
      "data": {
        "url": "http://itvads.dtvcdn.com/itv_csads/A060485536F0.mp4",
        "transparent": false,
        "videoRepeatCount": 1,
        "autoPlay": "false",
        "muted": true,
        "zOrder": "background",
        "preload": true
      },
      "fireTriggers": [
        {
          "mode": "COMPLETED",
          "name": "UNSQUEEZE"
        }
      ],
      "executionTriggers": [
        {
          "trigger": "STATE_STARTING"
        }
      ]
    },
    {
      "id": 2,
      "commandName": "SQUEEZE",
      "data": {
        "duration": 1000,
        "videoScale": {
          "scale_x": 0.6,
          "scale_y": 0.6,
          "pivot_x": 0.0,
          "pivot_y": 0.0
        },
        "videoMargin": {
          "left": 100,
          "top": 200,
          "right": 0,
          "bottom": 0
        },
        "videoBorder":{
          "state": "show",
          "mode": "PRE",
          "width":2,
          "color":"#FFFFFF"
        }
      },
      "fireTriggers": [
        {
          "mode": "COMPLETED",
          "name": "PLAY_VIDEO"
        }
      ],
      "executionTriggers": [
        {
          "trigger": "STATE_STARTED"
        }
      ]
    },
    {
      "id": 3,
      "commandName": "ACTION_COMMAND",
      "data": {
        "triggerCommandID": 1,
        "action": "PLAY"
      },
      "fireTriggers": [
        {
          "mode": "POST",
          "name": "REPORT"
        }
      ],
      "executionTriggers": [
        {
          "trigger": "PLAY_VIDEO"
        }
      ]
    },
    {
      "id": 4,
      "commandName": "REPORT_COMMAND",
      "measurementBaseURL": "https://measurementdemo2.emuse-tech.com/default.xml?PageID=9&MeasurementPointID=18&Version=11&ContentSetID=13",
      "providers": [
        {
          "name": "Emuse",
          "events": []
        },
        {
          "name": "ADR",
          "events": []
        }
        ],
      "executionTriggers": [
        {
          "trigger": "REPORT"
        }
      ]
    },
    {
      "id": 5,
      "commandName": "SQUEEZE",
      "data": {
        "duration": 1000,
        "videoScale": {
          "scale_x": 1.0,
          "scale_y": 1.0,
          "pivot_x": 0.0,
          "pivot_y": 0.0
        },
        "videoMargin": {
          "left": 0,
          "top": 0,
          "right": 0,
          "bottom": 0
        },
        "videoBorder":{
          "state": "hide",
          "mode": "COMPLETED"
        }
      },
      "fireTriggers": [
        {
          "mode": "PRE",
          "name": "STOP_VIDEO"
        },
        {
          "mode": "COMPLETED",
          "name": "REPORT_STOP"
        }
      ],
      "executionTriggers": [
        {
          "trigger": "STATE_STOPPING"
        },
        {
          "trigger": "STATE_ERROR"
        },
        {
          "trigger": "UNSQUEEZE"
        }
      ]
    },
    {
      "id": 6,
      "commandName": "ACTION_COMMAND",
      "data": {
        "triggerCommandID": 1,
        "action": "STOP"
      },
      "executionTriggers": [
        {
          "trigger": "STOP_VIDEO"
        }
      ]
    },
    {
      "id": 7,
      "commandName": "REPORT_COMMAND",
      "providers": [
        {
          "name": "Emuse",
          "events": []
        }
      ],
      "executionTriggers": [
        {
          "trigger": "REPORT_STOP",
          "conditions": [
            "STATE_PLAYING"
          ]
        },
        {
          "trigger": "STATE_STOPPED",
          "conditions": [
            "STATE_PLAYING"
          ]
        },
        {
          "trigger": "STATE_ERROR",
          "conditions": [
            "STATE_PLAYING"
          ]
        }
      ]
    }
  ],
  "exeAdUUID": "BE362ba4-ba37-4146-91de-be0e3e735977"
}
```

##### Squeeze command with SHOW_IMAGE

```JSON
{
  "_id": "5dd51db9e3b6870008c4d7d8",
  "experienceId": "f77bafc7-8a41-400b-acd8-002bcd6dacf4",
  "experienceMediaType": "Squeeze commands",
  "commands": [
    {
      "id": 1,
      "commandName":"SHOW_IMAGE",
      "data":{
        "720p": { "url":"https://tlv-resources.s3-us-west-2.amazonaws.com/show_image/coca_cola_cork.gif" },
        "1080p": { "url":"https://tlv-resources.s3-us-west-2.amazonaws.com/show_image/coca_cola_cork.gif"},
        "zOrder": "background"
      },
      "executionTriggers": [
        {
          "trigger": "STATE_STARTING"
        }
      ]
    },
    {
      "id": 2,
      "commandName": "SQUEEZE",
      "data": {
        "duration": 1000,
        "videoScale": {
          "scale_x": 0.6,
          "scale_y": 0.6,
          "pivot_x": 0.0,
          "pivot_y": 0.0
        },
        "videoMargin": {
          "left": 100,
          "top": 200,
          "right": 0,
          "bottom": 0
        }
      },
      "executionTriggers": [
        {
          "trigger": "STATE_STARTED"
        }
      ],
      "fireTriggers": [
        {
          "mode": "POST",
          "name": "REPORT"
        }
      ]
    },
    {
      "id": 3,
      "commandName": "REPORT_COMMAND",
      "executionTriggers": [
        {
          "trigger": "REPORT"
        }
      ]
    },
    {
      "id": 4,
      "commandName": "SQUEEZE",
      "data": {
        "duration": 1000,
        "videoScale": {
          "scale_x": 1.0,
          "scale_y": 1.0,
          "pivot_x": 0.0,
          "pivot_y": 0.0
        },
        "videoMargin": {
          "left": 0,
          "top": 0,
          "right": 0,
          "bottom": 0
        }
      },
      "executionTriggers": [
        {
          "trigger": "STATE_STOPPING"
        },
        {
          "trigger": "STATE_ERROR"
        }
      ]
    },
    {
      "id": 5,
      "commandName": "REPORT_COMMAND",
      "executionTriggers": [
        {
          "trigger": "REPORT_STOP",
          "conditions": [
            "STATE_PLAYING"
          ]
        },
        {
          "trigger": "STATE_STOPPED",
          "conditions": [
            "STATE_PLAYING"
          ]
        },
        {
          "trigger": "AD_ERROR",
          "conditions": [
            "STATE_PLAYING"
          ]
        }
      ]
    }
  ],
  "exeAdUUID": "BE362ba4-ba37-4146-91de-be0e3e735977"
}
```

#### Integration
The host container will be received as `XaafElementExtension’.

### Error Handling
`Squeeze` related `Error` will be invoked in case squeeze couldn’t be performed. The ad will move to error state.
If an error occurred between squeeze/unsqueeze, the video will be unsqueezed.
Any other errors will move the ad to ERROR state, and report error as usual. (e.g., `BAU`).

### Risks
- zOrder - dependent on integration. zOrder works only if the attributed views are siblings and have position ‘absolute’.
- XaafAdContainer - as of today we support one element, for squeeze BB, we need both VideoElement and SqueezeElement.

### Testing Strategy
- UT for new implemented logic
- UI tests - validating UI Behaviour: { squeeze data vs UI }, { video is playing upon squeeze }, { unsqueeze data vs UI }
