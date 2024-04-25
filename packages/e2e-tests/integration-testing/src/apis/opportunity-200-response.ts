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
          url: 'https://d1zocn0wsme2cv.cloudfront.net/A060867043M0.mp4',
          transparent: true,
          videoRepeatCount: 1,
          videoOptions: ['autoplay', 'muted']
        },
        report: {
          measurementBaseURL:
            'https://xaaf-metrics.att.com/Measurementl/default.xml?PageID=27&MeasurementPointID=78&Version=11&ContentSetID=7',
          providers: [
            {
              name: 'Emuse',
              events: [
                {
                  url:
                    'https://xaaf-metrics.att.com/Measurementl/default.xml?PageID=27&MeasurementPointID=76&Version=11&Status=0&ExtSrc=vod&DeviceType=firetv&PartnerProfileID=testidpostman&TransactionId=1590659059288721016&OppType=screensaver',
                  clientOutbound: [
                    {
                      paramType: 'clientFormattedTimeStamp',
                      paramName: 'ClientTime'
                    }
                  ]
                },
                {
                  url:
                    'https://xaaf-metrics.att.com/Measurementl/default.xml?PageID=27&MeasurementPointID=77&Version=11&Status=0&ExtSrc=vod&DeviceType=firetv&PartnerProfileID=testidpostman&TransactionId=1590659059288721016&OppType=screensaver',
                  clientOutbound: [
                    {
                      paramType: 'clientFormattedTimeStamp',
                      paramName: 'ClientTime'
                    }
                  ]
                },
                {
                  url:
                    'https://xaaf-metrics.att.com/Measurementl/default.xml?PageID=27&MeasurementPointID=78&Version=11&ContentSetID=7&Status=0&ExtSrc=vod&DeviceType=firetv&PartnerProfileID=testidpostman&TransactionId=1590659059288721016&OppType=screensaver',
                  clientOutbound: [
                    {
                      paramType: 'clientFormattedTimeStamp',
                      paramName: 'ClientTime'
                    }
                  ]
                }
              ]
            },
            {
              name: 'FREEWHEEL',
              events: [
                {
                  url:
                    'http://g10.s.fwmrm.net/ad/l/1?s=b117&n=372464%3B372464&t=1590659059288721016&f=&r=372464&adid=40215409&reid=22504344&arid=0&auid=&cn=defaultImpression&et=i&_cc=40215409,22504344,,,1590659059,1&tpos=0&iw=&uxnw=&uxss=&uxct=&metr=1301&init=1&inif=1'
                }
              ]
            },
            {
              name: 'ADR',
              events: [
                {
                  url: 'http://adr2-test.att.com/slr-vast-proxy/BeaconProxy/a4fadde0-b448-11e9-a467-021f7c4e5d2e/1'
                }
              ]
            },
            {
              name: 'COMSCORE',
              events: [
                {
                  url:
                    'https://sb.scorecardresearch.com/p?c1=3&c2=33324397&c3=34931097&c4=6062506_220347548&c5=40215408_9486916&c11=220347548&c12=&cj=1&ax_fwd=1&rn=1397330157&ns_st_pr=AAF%20Test%20Ad%5E&ns_st_ge=&ns_st_pu=DIRECTV%20STB%20Watch%20Now%20VOD%20%7C%20AAF&ns_st_ct=dtv_stb_watch_vod_aaf&ns_stb_id=trk0iwmfndbz4nbvofx3sa%3D%3D&ns_ap_device=&ns_ap_pn='
                }
              ]
            },
            {
              name: 'DATA_PLUS_MATH',
              events: [
                {
                  url: 'http://p.tvpixel.com/data/plus/math/mocked/url'
                }
              ]
            }
          ],
          adLifeCycle: [
            {
              paramType: 'projectId',
              paramName: 6026
            },
            {
              paramType: 'projectBuildNumber',
              paramName: 2
            }
          ]
        },
        executionTriggers: [
          {
            trigger: 'STATE_STARTING'
          }
        ]
      }
    ],
    exeAdUUID: 'BE14b235-0631-43d7-b872-416238071fde',
    experienceId: 'ac397567-2001-4cb7-9917-2948bbaab539',
    templateId: 2
  }
};
