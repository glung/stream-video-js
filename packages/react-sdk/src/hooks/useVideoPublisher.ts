import {
  Call,
  getVideoStream,
  SfuModels,
  watchForDisconnectedVideoDevice,
} from '@stream-io/video-client';
import { useLocalParticipant, useStore } from '@stream-io/video-react-bindings';
import { useCallback, useEffect, useRef } from 'react';
import { map } from 'rxjs';
import { useDebugPreferredVideoCodec } from '../components/Debug/useIsDebugMode';

export type VideoPublisherInit = {
  call: Call;
  initialVideoMuted?: boolean;
  videoDeviceId?: string;
};

export const useVideoPublisher = ({
  call,
  initialVideoMuted,
  videoDeviceId,
}: VideoPublisherInit) => {
  const { localParticipant$ } = useStore();
  // helper reference to determine initial publishing of the media stream
  const initPubRef = useRef<boolean>(true);
  const participant = useLocalParticipant();
  const preferredCodec = useDebugPreferredVideoCodec();
  const isPublishingVideo = participant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  const publishVideoStream = useCallback(async () => {
    try {
      const videoStream = await getVideoStream(videoDeviceId);
      await call.publishVideoStream(videoStream, { preferredCodec });
    } catch (e) {
      console.log('Failed to publish video stream', e);
    }
  }, [call, preferredCodec, videoDeviceId]);

  useEffect(() => {
    let interrupted = false;

    if (initialVideoMuted || (!isPublishingVideo && !initPubRef.current))
      return;

    getVideoStream(videoDeviceId).then((stream) => {
      if (interrupted && stream.active)
        return stream.getTracks().forEach((t) => t.stop());

      initPubRef.current = false;
      return call.publishVideoStream(stream, { preferredCodec });
    });

    return () => {
      interrupted = true;
      call.stopPublish(SfuModels.TrackType.VIDEO);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoDeviceId, call, preferredCodec]);

  useEffect(() => {
    const subscription = watchForDisconnectedVideoDevice(
      localParticipant$.pipe(map((p) => p?.videoDeviceId)),
    ).subscribe(async () => {
      call.setVideoDevice(undefined);
      await call.stopPublish(SfuModels.TrackType.VIDEO);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$, call]);

  return publishVideoStream;
};
