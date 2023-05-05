import { useCallback, useEffect } from 'react';
import { map } from 'rxjs';
import {
  CallingState,
  getVideoStream,
  OwnCapability,
  SfuModels,
  watchForAddedDefaultVideoDevice,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import {
  useCall,
  useCallCallingState,
  useCallState,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { useDebugPreferredVideoCodec } from '../../components/Debug/useIsDebugMode';

/**
 * @internal
 */
export type VideoPublisherInit = {
  initialVideoMuted?: boolean;
  videoDeviceId?: string;
};

/**
 * @internal
 * @category Device Management
 */
export const useVideoPublisher = ({
  initialVideoMuted,
  videoDeviceId,
}: VideoPublisherInit) => {
  const call = useCall();
  const callState = useCallState();
  const callingState = useCallCallingState();
  const participant = useLocalParticipant();
  const { localParticipant$ } = callState;

  const preferredCodec = useDebugPreferredVideoCodec();
  const isPublishingVideo = participant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const publishVideoStream = useCallback(async () => {
    if (!call) return;
    if (!call.permissionsContext.hasPermission(OwnCapability.SEND_VIDEO)) {
      throw new Error(`No permission to publish video`);
    }
    try {
      const videoStream = await getVideoStream(videoDeviceId);
      await call.publishVideoStream(videoStream, { preferredCodec });
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, preferredCodec, videoDeviceId]);

  useEffect(() => {
    if (callingState === CallingState.JOINED && !initialVideoMuted) {
      publishVideoStream().catch((e) => {
        console.error('Failed to publish video stream', e);
      });
    }
  }, [callingState, initialVideoMuted, publishVideoStream]);

  useEffect(() => {
    if (!localParticipant$) return;
    const subscription = watchForDisconnectedVideoDevice(
      localParticipant$.pipe(map((p) => p?.videoDeviceId)),
    ).subscribe(async () => {
      if (!call) return;
      call.setVideoDevice(undefined);
      await call.stopPublish(SfuModels.TrackType.VIDEO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  useEffect(() => {
    if (!participant?.videoStream || !call || !isPublishingVideo) return;

    const [track] = participant.videoStream.getVideoTracks();
    const selectedVideoDeviceId = track.getSettings().deviceId;

    const republishDefaultDevice = watchForAddedDefaultVideoDevice().subscribe(
      async () => {
        if (
          !(
            call &&
            participant.videoStream &&
            selectedVideoDeviceId === 'default'
          )
        )
          return;
        // We need to stop the original track first in order
        // we can retrieve the new default device stream
        track.stop();
        const videoStream = await getVideoStream('default');
        await call.publishVideoStream(videoStream);
      },
    );

    const handleTrackEnded = async () => {
      if (selectedVideoDeviceId === videoDeviceId) {
        const videoStream = await getVideoStream(videoDeviceId);
        await call.publishVideoStream(videoStream);
      }
    };

    track.addEventListener('ended', handleTrackEnded);
    return () => {
      track.removeEventListener('ended', handleTrackEnded);
      republishDefaultDevice.unsubscribe();
    };
  }, [videoDeviceId, call, participant?.videoStream, isPublishingVideo]);

  return publishVideoStream;
};
