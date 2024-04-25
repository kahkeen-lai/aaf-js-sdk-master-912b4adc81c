export default {
  method: 'POST',
  path: '/auth/v1/login',
  status: 200,
  data: {
    token:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsInRlbmFudE5hbWUiOiJkaXJlY3R2IiwiYXBwSWQiOiI1ZTZmNDJmZmZjODE1OTAwMWJiMjE5ZjIiLCJzZGtWZXJzaW9uIjoidjEiLCJlbnZpcm9ubWVudCI6InRsdi1hZHZlcnRpc2UtNTk4OCIsInBsYXRmb3JtTmFtZSI6ImZpcmV0diIsInNka05hbWUiOiJhbmRyb2lkdHYiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiYXBpS2V5SWF0IjoxNTg0MzQ5OTU2LCJpYXQiOjE1OTc3NjQ5NTEsImV4cCI6MTY5Nzc3OTM1MSwiaXNzIjoiQVQmVCIsInN1YiI6InRva2VuIn0.LZ8lZkT4mugtk_hijjg7o4Wj-ONC2D-kMj7HHBXeuXSbA1tmUSTh0THN8dSDPmIBNL_IU2RdZDKHjcz72-LKJJnmzNkx90YvW_zRVEDsETUwmWFUNWyv4lSMRazkSbRJC4L7dG4uTkLVQr9PMm4PMpoURAa7WW9iM5sPh61N-IBweiLAEgvv6gkOwHacOL4RtLEHyEUS4ln2FydPO9KsBuxrCwu0bgM3WEJpquxkDJEi3Y8139zrV4tMTXCsonx-XPyNCPqXczB_fuexPkGU_OJw-hHOwQMLxpXH7o9y-OsuBJFk-1eu8KLHOYuTxjCsaecccKzyINn7gS7w7_vkyw',
    refreshToken:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6IjVlNmY0MmZlZmM4MTU5MDAxYmIyMTlmMCIsInRlbmFudE5hbWUiOiJkaXJlY3R2IiwiYXBwSWQiOiI1ZTZmNDJmZmZjODE1OTAwMWJiMjE5ZjIiLCJzZGtWZXJzaW9uIjoidjEiLCJlbnZpcm9ubWVudCI6InRsdi1hZHZlcnRpc2UtNTk4OCIsInBsYXRmb3JtTmFtZSI6ImZpcmV0diIsInNka05hbWUiOiJhbmRyb2lkdHYiLCJwcml2aWxlZ2VUeXBlIjoidGVzdGVyIiwiYXBpS2V5SWF0IjoxNTg0MzQ5OTU2LCJpYXQiOjE1OTc3NjQ5NTEsImV4cCI6MTYwNTU0MDk1MSwiaXNzIjoiQVQmVCIsInN1YiI6InJlZnJlc2hUb2tlbiJ9.Gd4LvAX42OEi-eN-gJfeIeLKMbRgEDEeQSsEvU7E6Ba4kvJuGB7wnEcljgs_6AEfVN3-K462mFAvJK_T463X9u4MKjODLrF7GWUisxkplFf7AuuRIZVuoAFTCDJly5ndimjcsWWt_RqLFWY_hDsoys3A1tC-AOXBTRwhQOGKwWU-ReIG1jYlBjJrRuaQxDWeuCiU2X_9x5zP82myhSgPu6Qact8iOMM5330BhTjzjEOJyc3NSigJGELC61f6ae68PWYzyJhflorCRxEdsW9hjdtpNU_Y7VRPS6fQaR9kaBbuHyQ77swUae2EjKCGUBYhvpHqUSQY64r0YCK4Zl15Yg',
    configuration: {
      content_toggle_list: [
        {
          mode: 'blacklist',
          contentType: ['live'],
          programName: ['game_of_throne', 'house_of_cards'],
          programmerName: ['disney', 'disney junior'],
          networkName: ['abc', 'cnn'],
          isDuringAd: ['true'],
          channelName: [
            'Boomerang',
            'Cartoon Network',
            'Discovery Familia',
            'Discovery Family Channel',
            'Disney Channel HD',
            'Disney Junior HD',
            'Disney XD HD',
            'Nick Jr.',
            'Nickelodeon East HD',
            'Nicktoons'
          ]
        }
      ],
      _id: '5ec2829ab92d3100196189c9',
      nr_url: 'https://insights-collector.newrelic.com/v1/accounts/2388469/events',
      nr_rest_api_key: 'MTlGQmu_JJr8hZEOuQ-Yf6NHdvVGrb6E',
      xaaba_url: 'https://xaaf-be-aio.att.com/advertise-5988/mock/request/youi/xaaba/v1/opportunity',
      rollout_api_key: '5c7e4da00fe03576b7dc0b66',
      lazy_refresh_token_before_expiration_minutes: 5,
      cacheConfiguration: {
        experiences: [],
        _id: '5ec2829ab92d3100196189ca'
      },
      http_timeout: 3000,
      xaaba_timeout: 3000,
      assets_timeout: 3000,
      player_timeout: 6000,
      buffer_timeout: 6000,
      reporting_timeout: 3000,
      pre_ad_start_xaaba_engage_time: 5000,
      reporting_bulk: 100,
      reporting_bulk_delay: 180000,
      access_token: {
        _id: '5ec2829ab92d3100196189cb',
        expiration: '4h',
        issuer: 'AT&T'
      },
      refresh_token: {
        _id: '5ec2829ab92d3100196189cc',
        expiration: '90d',
        issuer: 'AT&T'
      },
      playerConfiguration: {
        _id: '5ec2829ab92d3100196189cd',
        minBuffer: 15000,
        maxBuffer: 50000,
        bufferForPlayback: 2500,
        bufferForPlaybackAfterRebuffer: 5000
      }
    }
  }
};
