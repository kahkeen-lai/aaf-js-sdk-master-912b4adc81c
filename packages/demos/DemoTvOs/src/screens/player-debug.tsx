/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useEffect, useRef, useState} from 'react';
import {NativeSyntheticEvent, StyleSheet} from 'react-native';
import {Table, TableWrapper, Rows, Col} from 'react-native-table-component';
import {View} from 'react-native';

type VideoError = any; // FIXME
type Video = any; // FIXME

const styles = StyleSheet.create({
  container: {padding: 16, paddingTop: 30, width: 500},
  tableWrapper: {borderWidth: 2, borderColor: 'white'},
  head: {backgroundColor: '#f1f8ff'},
  wrapper: {flexDirection: 'row'},
  title: {backgroundColor: 'gray'},
  row: {backgroundColor: 'gray'},
  text: {textAlign: 'left', color: 'white'},
  video: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    opacity: 1,
    top: 0,
    left: 0,
  },
});

export const PlayerDebug = (): JSX.Element => {
  const video: React.RefObject<Video> = useRef<Video>(null);

  const videoUriSources: VideoUriSource[] = [
    [
      'MP4',
      'https://xandrssads-sponsored.akamaized.net/xaaf_csads/A061281250F0.mp4',
    ],
    [
      'MP4',
      'https://xandrssads-sponsored.akamaized.net/xaaf_csads/A061027058F0.mp4',
    ],
    [
      'MP4',
      'https://xandrssads-sponsored.akamaized.net/xaaf_csads/A061238803F0.mp4',
    ],
    [
      'MP4',
      'https://xandrssads-sponsored.akamaized.net/xaaf_csads/A061164755F0.mp4',
    ],
    [
      'MP4',
      'https://xandrssads-sponsored.akamaized.net/xaaf_csads/A061163592F0.mp4',
    ],
    [
      'MP4',
      'https://xandrssads-sponsored.akamaized.net/xaaf_csads/A060887987M0.mp4',
    ],
    [
      'MP4',
      'https://xandrssads-sponsored.akamaized.net/xaaf_csads/A061158361F0.mp4',
    ],
    [
      'MP4',
      'https://xandrssads-sponsored.secure.footprint.net/XAAF/di/DTV_Strm_720p/DTV_Strm_720p.mp4',
    ],
  ].map(([type, uri]) => ({uri, type}));

  const [mediaState, setMediaState] = useState<MediaStateOptions>();
  const [playbackState, setPlaybackState] = useState<PlaybackStateOptions>();
  const [videoUriSource] = useState<VideoUriSource>(videoUriSources[0]);
  const [minimumBufferLengthMs, setMinimumBufferLengthMs] = useState<number>(0);
  const [framesPerSecond, setFramesPerSecond] = useState<number>();
  const [videoBitrateKbps, setVideoBitrateKbps] = useState<number>(0);
  const [bufferLengthMs, setBufferLengthMs] = useState<number>(0);
  const [isLive, setIsLive] = useState<boolean>();
  const [totalBitrateKbps, setTotalBitrateKbps] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo>();
  const [bufferLength] = useState<BufferConfig>({min: 50_000, max: 50_000});
  const [lastPlayerEvent, setLastPlayerEvent] = useState<string>();
  const [percentagePlayed, setPercentagePlayed] = useState<number>();
  const [percentageBufferedMin, setPercentageBufferedMin] = useState<number>();
  const [percentageBufferedMax, setPercentageBufferedMax] = useState<number>();
  const [percentageBufferedTotal, setPercentageBufferedTotal] = useState<
    number
  >();
  const [intervalHandle, setIntervalHandle] = useState<number>();
  const [bufferingSeconds, setBufferingSeconds] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const stats:
        | VideoStats
        | undefined = await video.current?.getStatistics();
      setMinimumBufferLengthMs(stats?.minimumBufferLengthMs ?? 0);
      setFramesPerSecond(stats?.framesPerSecond);
      setVideoBitrateKbps(stats?.videoBitrateKbps ?? 0);
      setBufferLengthMs(stats?.bufferLengthMs ?? 0);
      setIsLive(stats?.isLive);
      setTotalBitrateKbps(stats?.totalBitrateKbps ?? 0);
    }, 5_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPercentagePlayed(Math.round((currentTime / videoDuration) * 100));
    setPercentageBufferedMin(
      Math.round((bufferLengthMs / minimumBufferLengthMs) * 100),
    );
    setPercentageBufferedMax(
      Math.round((bufferLengthMs / bufferLength.max) * 100),
    );
    setPercentageBufferedTotal(
      Math.round((bufferLengthMs / videoDuration) * 100),
    );
  }, [
    playerInfo,
    bufferLength,
    mediaState,
    playbackState,
    framesPerSecond,
    bufferLengthMs,
  ]);

  return (
    <>
      <Video
        style={styles.video}
        source={videoUriSource}
        onReady={async () => {
          setLastPlayerEvent('onReady');
          video.current?.play();
          const info:
            | PlayerInfo
            | undefined = await video.current?.getPlayerInformation();
          setPlayerInfo(info);
        }}
        ref={video}
        muted={false}
        mediaPlaybackControlsEnabled={true}
        bufferLength={bufferLength}
        onPreparing={() => setLastPlayerEvent('onPreparing')}
        onPaused={() => setLastPlayerEvent('onPaused')}
        onFinalized={() => setLastPlayerEvent('onFinalized')}
        onPlaying={() => setLastPlayerEvent('onPlaying')}
        onErrorOccurred={({nativeEvent}: VideoError) =>
          setLastPlayerEvent(
            `onErrorOccurred ${nativeEvent.errorCode}/${nativeEvent.nativePlayerErrorCode} ${nativeEvent.message}`,
          )
        }
        onPlaybackComplete={() => setLastPlayerEvent('onPlaybackComplete')}
        onDurationChanged={(duration: number) => {
          setLastPlayerEvent('onDurationChanged ' + duration);
          setVideoDuration(duration);
        }}
        onBufferingStarted={() => {
          setLastPlayerEvent('onBufferingStarted');
          const handle: any = setInterval(() => {
            setBufferingSeconds(bufferingSeconds + 1);
          }, 1_000);
          setIntervalHandle(handle);
        }}
        onBufferingEnded={() => {
          setLastPlayerEvent('onBufferingEnded');
          if (intervalHandle) {
            clearInterval(intervalHandle);
            setBufferingSeconds(0);
          }
        }}
        onCurrentTimeUpdated={(time: number) => {
          setCurrentTime(time);
        }}
        onStateChanged={(playerState: NativeSyntheticEvent<MediaState>) => {
          setPlaybackState(playerState.nativeEvent.playbackState);
          setMediaState(playerState.nativeEvent.mediaState);
        }}
      />
      <View style={styles.container}>
        <Table borderStyle={{borderWidth: 1}}>
          <TableWrapper
            style={styles.wrapper}
            borderStyle={styles.tableWrapper}>
            <Col
              data={[
                'lastPlayerEvent',
                'mediaState',
                'playbackState',
                'playerName',
                'playerVersion',
                'bufferLength.min',
                'bufferLength.max',
                'currentTime',
                'videoDuration',
                'percentagePlayed',
                'bufferLengthMs',
                'percentageBufferedMin',
                'percentageBufferedMax',
                'percentageBufferedTotal',
                'videoBitrateKbps',
                'totalBitrateKbps',
                'isLive',
                'source',
                'type',
              ]}
              style={styles.title}
              textStyle={styles.text}
            />
            <Rows
              data={[
                [lastPlayerEvent],
                [mediaState?.toUpperCase()],
                [playbackState?.toUpperCase()],
                [`${playerInfo?.name}`],
                [`${playerInfo?.version}`],
                [`${bufferLength.min}ms`],
                [`${bufferLength.max}ms`],
                [`${currentTime}ms`],
                [`${videoDuration}ms`],
                [`${percentagePlayed}%`],
                [`${bufferLengthMs}ms`],
                [`${percentageBufferedMin}%`],
                [`${percentageBufferedMax}%`],
                [`${percentageBufferedTotal}%`],
                [`${videoBitrateKbps} Kbps`],
                [`${totalBitrateKbps} Kbps`],
                [`${isLive}`],
                [`.../${videoUriSource.uri.split('/').pop()}`],
                [videoUriSource.type],
              ]}
              flexArr={[1]}
              style={styles.row}
              textStyle={styles.text}
            />
          </TableWrapper>
        </Table>
      </View>
    </>
  );
};
