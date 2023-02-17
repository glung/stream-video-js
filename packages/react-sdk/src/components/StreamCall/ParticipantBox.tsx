import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import {
  Call,
  SfuModels,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useIsDebugMode } from '../Debug/useIsDebugMode';
import { DebugParticipantPublishQuality } from '../Debug/DebugParticipantPublishQuality';
import { DebugStatsView } from '../Debug/DebugStatsView';
import { Video } from './Video';
import { Notification } from '../Notification';

export const ParticipantBox = (props: {
  participant: StreamVideoParticipant;
  isMuted?: boolean;
  call: Call;
  sinkId?: string;
}) => {
  const { participant, isMuted = false, call, sinkId } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    videoStream,
    audioStream,
    isLoggedInUser: isLocalParticipant,
    isDominantSpeaker,
    isSpeaking,
    publishedTracks,
    connectionQuality,
  } = participant;

  const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const hasVideo = publishedTracks.includes(SfuModels.TrackType.VIDEO);

  useEffect(() => {
    const $el = audioRef.current;
    console.log(`Attaching audio stream`, $el, audioStream);
    if (!$el) return;
    if (audioStream) {
      $el.srcObject = audioStream;
      if (($el as any).setSinkId) {
        ($el as any).setSinkId(sinkId || '');
      }
    }
    return () => {
      $el.srcObject = null;
    };
  }, [audioStream, sinkId]);

  const connectionQualityAsString = String(
    SfuModels.ConnectionQuality[connectionQuality],
  ).toLowerCase();

  const isDebugMode = useIsDebugMode();
  return (
    <div
      className={clsx(
        'str-video__participant',
        isSpeaking && 'str-video__participant--speaking',
      )}
    >
      <audio autoPlay ref={audioRef} muted={isMuted} />
      <div className="str-video__video-container">
        <Video
          call={call}
          participant={participant}
          kind="video"
          className={clsx(
            'str-video__remote-video',
            isLocalParticipant && 'mirror',
          )}
          muted={isMuted}
          autoPlay
        />
        <div className="str-video__participant_details">
          <span className="str-video__participant_name">
            {participant.user?.name || participant.userId}
            {isDominantSpeaker && (
              <span
                className="str-video__participant_name--dominant_speaker"
                title="Dominant speaker"
              />
            )}
            <Notification
              isVisible={
                isLocalParticipant &&
                connectionQuality === SfuModels.ConnectionQuality.POOR
              }
              message="Poor connection quality. Please check your internet connection."
            >
              <span
                className={clsx(
                  'str-video__participant__connection-quality',
                  `str-video__participant__connection-quality--${connectionQualityAsString}`,
                )}
                title={connectionQualityAsString}
              />
            </Notification>
            {!hasAudio && (
              <span className="str-video__participant_name--audio-muted"></span>
            )}
            {!hasVideo && (
              <span className="str-video__participant_name--video-muted"></span>
            )}
          </span>
          {isDebugMode && (
            <>
              <DebugParticipantPublishQuality
                participant={participant}
                call={call}
              />
              <DebugStatsView
                call={call}
                kind={isLocalParticipant ? 'publisher' : 'subscriber'}
                mediaStream={videoStream}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
