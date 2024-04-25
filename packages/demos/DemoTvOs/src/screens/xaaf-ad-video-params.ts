export const adStartDelayHint = 2000;
export const projectId = 128;
export const videoContainer = [
  {
    video: { uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', type: 'MP4' },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '1'],
      ['programName', 'game_of_throne'],
      ['networkName', 'abc'],
      ['isDuringAd', 'false'],
      ['channelName', 'espn'],
      ['programmerName', 'disney'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://etlive-mediapackage-fastly.cbsaavideo.com/dvr/manifest.m3u8?iu=/8264/vaw-can/desktop/cbslocal',
      type: 'HLS'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'live'],
      ['channelId', '1'],
      ['programName', 'cbs_news'],
      ['networkName', 'cbs'],
      ['isDuringAd', 'false'],
      ['channelName', 'espn'],
      ['programmerName', 'disney'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://nmxlive.akamaized.net/hls/live/529965/Live_1/index.m3u8',
      type: 'HLS'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'live'],
      ['channelId', '1'],
      ['programName', 'nmx_live'],
      ['networkName', 'nmxlive'],
      ['isDuringAd', 'false'],
      ['channelName', 'espn'],
      ['programmerName', 'disney'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://cbsn-us-cedexis.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8',
      type: 'HLS'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'live'],
      ['channelId', '1'],
      ['programName', 'the_bachelorette'],
      ['networkName', 'cbs'],
      ['isDuringAd', 'false'],
      ['channelName', 'espn'],
      ['programmerName', 'disney'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: { uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', type: 'MP4' },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '2'],
      ['programName', 'ElephantsDream'],
      ['networkName', 'news'],
      ['isDuringAd', 'true'],
      ['channelName', 'mynews'],
      ['programmerName', 'news'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      type: 'MP4'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '3'],
      ['programName', 'Cartoon Network'],
      ['networkName', 'blackout'],
      ['isDuringAd', 'true'],
      ['channelName', 'Cartoon Network'],
      ['programmerName', 'Cartoon Network'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      type: 'MP4'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '5'],
      ['programName', 'ForBiggerEscapes'],
      ['networkName', 'fox'],
      ['isDuringAd', 'true'],
      ['channelName', 'fox'],
      ['programmerName', 'ForBiggerEscapes'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: { uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', type: 'MP4' },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '6'],
      ['programName', 'ForBiggerFun'],
      ['networkName', 'baskteball'],
      ['isDuringAd', 'true'],
      ['channelName', 'sports'],
      ['programmerName', 'nba'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      type: 'MP4'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '7'],
      ['programName', 'ForBiggerJoyrides'],
      ['networkName', 'nbc'],
      ['isDuringAd', 'true'],
      ['channelName', 'nbc'],
      ['programmerName', 'nbc'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: { uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', type: 'MP4' },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '8'],
      ['programName', 'game_of_throne'],
      ['networkName', 'abc'],
      ['isDuringAd', 'true'],
      ['channelName', 'espn'],
      ['programmerName', 'disney'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      type: 'MP4'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '9'],
      ['programName', 'SubaruOutbackOnStreetAndDirt'],
      ['networkName', 'cnn'],
      ['isDuringAd', 'true'],
      ['channelName', 'cnn'],
      ['programmerName', 'SubaruOutbackOnStreetAndDirt'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: { uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', type: 'MP4' },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '10'],
      ['programName', 'game_of_throne'],
      ['networkName', 'hbo'],
      ['isDuringAd', 'true'],
      ['channelName', 'hbo'],
      ['programmerName', 'game_of_throne'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
      type: 'MP4'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '11'],
      ['programName', 'VolkswagenGTIReview'],
      ['networkName', 'def'],
      ['isDuringAd', 'true'],
      ['channelName', 'espnu'],
      ['programmerName', 'VolkswagenGTIReview'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      type: 'MP4'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '12'],
      ['programName', 'WeAreGoingOnBullrun'],
      ['networkName', 'abc'],
      ['isDuringAd', 'true'],
      ['channelName', 'nbc'],
      ['programmerName', 'nbc'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  },
  {
    video: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      type: 'MP4'
    },
    initAdInfoMapper: new Map([
      ['contentType', 'vod'],
      ['channelId', '13'],
      ['programName', 'Boomerang'],
      ['networkName', 'Boomerang'],
      ['isDuringAd', 'true'],
      ['channelName', 'Boomerang'],
      ['programmerName', 'Boomerang'],
      ['expType', 'out_of_stream'],
      ['adStartDelayHint', adStartDelayHint.toString()],
      ['context', 'pause'],
      ['hostCCPAEnabled', 'true']
    ])
  }
];
