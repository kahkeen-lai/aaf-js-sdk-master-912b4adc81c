export default {
  method: 'GET',
  path: '/xaaba/v1/opportunity',
  status: 200,
  data: {
    experienceMediaType: 'Video Screensaver Ad',
    commands: [
      {
        commandName: 'SHOW_VIDEO',
        data: {
          url: 'https://d1zocn0wsme2cv.cloudfront.net/A060755827F0.mp4',
          transparent: true,
          videoRepeatCount: 1,
          videoOptions: ['autoplay', 'muted']
        },
        report: {
          measurementBaseURL_org:
            'https://xaaf-metrics.att.com/Measurementl/default.xml?PageID=53&MeasurementPointID=129&Version=11&ContentSetID=13',
          measurementBaseURL: 'https://xaaf-be-dev.att.com/mock/request/youi/500',
          providers: [
            {
              name: 'Emuse',
              events: [
                {
                  url: 'https://xaaf-be-dev.att.com/mock/request/youi/500',
                  clientOutbound: [
                    {
                      paramType: 'clientFormattedTimeStamp',
                      paramName: 'ClientTime'
                    },
                    {
                      paramType: 'deviceId',
                      paramName: 'DeviceID'
                    }
                  ]
                }
              ]
            }
          ],
          adLifeCycle: [
            {
              paramType: 'projectId',
              paramName: 6051
            },
            {
              paramType: 'projectBuildNumber',
              paramName: 2
            }
          ]
        },
        executionTriggers: [
          {
            trigger: 'STATE_STARTED'
          }
        ]
      }
    ],
    exeAdUUID: 'BEffe7e3-1314-4937-8caf-270712e627c2',
    experienceId: 'f8e90605-5b2a-42d8-b097-22de585943a9',
    templateId: 2
  }
};
