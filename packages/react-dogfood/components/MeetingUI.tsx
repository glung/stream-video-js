import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import Gleap from 'gleap';
import {
  CallParticipantsList,
  CallStatsButton,
  CancelCallButton,
  CompositeButton,
  DeviceSettings,
  GetInviteLinkButton,
  IconButton,
  LoadingIndicator,
  ReactionsButton,
  RecordCallButton,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  Stage,
  StreamCallProvider,
  ToggleAudioPublishingButton,
  ToggleCameraPublishingButton,
  ToggleParticipantListButton,
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { IconInviteLinkButton, InviteLinkButton } from './InviteLinkButton';
import { CallHeaderTitle } from './CallHeaderTitle';
import { Lobby } from './Lobby';
import { Button, Stack, Typography } from '@mui/material';
import { StreamChat } from 'stream-chat';

import {
  ChatUI,
  ChatWrapper,
  NewMessageNotification,
  UnreadCountBadge,
  USAGE_GUIDE_LINK,
} from '.';
import { useWatchChannel } from '../hooks';
import { DeviceSettingsCaptor } from './DeviceSettingsCaptor';

const contents = {
  'error-join': {
    heading: 'Failed to join the call',
  },
  'error-leave': {
    heading: 'Error when disconnecting',
  },
};

export const MeetingUI = ({
  chatClient,
}: {
  chatClient: StreamChat | null;
}) => {
  const [show, setShow] = useState<
    'lobby' | 'error-join' | 'error-leave' | 'loading' | 'active-call'
  >('lobby');
  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const client = useStreamVideoClient();
  const activeCall = useActiveCall();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const showSidebar = showParticipants || showChat;

  // FIXME: could be replaced with "notification.message_new" but users would have to be at least members
  // possible fix with "allow to join" permissions in place (expensive?)
  const channelWatched = useWatchChannel({ chatClient, channelId: callId });

  const toggleParticipantList = useCallback(
    () => setShowParticipants((prev) => !prev),
    [],
  );

  const hideParticipantList = useCallback(() => setShowParticipants(false), []);

  const onJoin = useCallback(async () => {
    if (!client) return;
    setShow('loading');
    try {
      await client.joinCall(callId, callType);
      setShow('active-call');
    } catch (e) {
      console.error(e);
      setShow('error-join');
    }
  }, [callId, callType, client]);

  const onLeave = useCallback(async () => {
    setShow('loading');
    try {
      await activeCall?.cancel();
      await router.push('/');
    } catch (e) {
      console.error(e);
      setShow('error-leave');
    }
  }, [activeCall, router]);

  useEffect(() => {
    const handlePageLeave = async () => {
      await activeCall?.cancel();
    };
    router.events.on('routeChangeStart', handlePageLeave);
    return () => {
      router.events.off('routeChangeStart', handlePageLeave);
    };
  }, [activeCall, router.events]);

  if (show === 'error-join' || show === 'error-leave') {
    return (
      <ErrorPage
        heading={contents[show].heading}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );
  }
  if (show === 'lobby') return <Lobby onJoin={onJoin} />;

  if (show === 'loading') return <LoadingScreen />;

  if (!activeCall)
    return (
      <ErrorPage
        heading={'Lost active call connection'}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );

  return (
    <StreamCallProvider call={activeCall}>
      <div className="str-video str-video__call">
        <div className="str-video__call__main">
          <div className="str-video__call-header">
            <CallHeaderTitle />
            <div className="str-video__call-header__controls-group">
              <IconButton
                icon="info-document"
                title="Usage guide and known limitations"
                onClick={() => {
                  if (window) {
                    window.open(
                      USAGE_GUIDE_LINK,
                      '_blank',
                      'noopener,noreferrer',
                    );
                  }
                }}
              />
              <GetInviteLinkButton Button={IconInviteLinkButton} />
              <DeviceSettings />
            </div>
          </div>
          <Stage call={activeCall} />
          <div
            className="str-video__call-controls"
            data-testid="str-video__call-controls"
          >
            <div className="rd-call-controls-group">
              <RecordCallButton call={activeCall} />
              <ScreenShareButton call={activeCall} />
              <ReactionsButton />
            </div>
            <div className="rd-call-controls-group">
              <SpeakingWhileMutedNotification>
                <ToggleAudioPublishingButton />
              </SpeakingWhileMutedNotification>
              <ToggleCameraPublishingButton />
              <CancelCallButton call={activeCall} onClick={onLeave} />
            </div>
            <div className="rd-call-controls-group">
              <CallStatsButton />
              <ToggleParticipantListButton
                enabled={showParticipants}
                onClick={toggleParticipantList}
              />
              <NewMessageNotification
                chatClient={chatClient}
                channelWatched={channelWatched}
                disableOnChatOpen={showChat}
              >
                <div className="str-chat__chat-button__wrapper">
                  <CompositeButton caption="Chat" active={showChat}>
                    <IconButton
                      enabled={showChat}
                      disabled={!chatClient}
                      onClick={() => setShowChat((prev) => !prev)}
                      icon="chat"
                    />
                  </CompositeButton>
                  {!showChat && (
                    <UnreadCountBadge
                      channelWatched={channelWatched}
                      chatClient={chatClient}
                      channelId={callId}
                    />
                  )}
                </div>
              </NewMessageNotification>
            </div>
          </div>
        </div>
        {showSidebar && (
          <div className="str-video__sidebar">
            {showParticipants && (
              <CallParticipantsList
                onClose={hideParticipantList}
                InviteLinkButton={InviteLinkButton}
              />
            )}

            <ChatWrapper chatClient={chatClient}>
              {showChat && (
                <div className="str-video__chat">
                  <ChatUI
                    onClose={() => setShowChat(false)}
                    channelId={callId}
                  />
                </div>
              )}
            </ChatWrapper>
          </div>
        )}
      </div>
      <DeviceSettingsCaptor />
    </StreamCallProvider>
  );
};

type ErrorPageProps = {
  heading: string;
  onClickHome: () => void;
  onClickLobby: () => void;
};

const ErrorPage = ({ heading, onClickHome, onClickLobby }: ErrorPageProps) => (
  <Stack height={1} justifyContent="center" alignItems="center" gap={5}>
    <div>
      <Typography variant="h2" textAlign="center">
        {heading}
      </Typography>
      <Typography variant="subtitle1" textAlign="center">
        (see the console for more info)
      </Typography>
    </div>
    <Stack direction="row" gap={2}>
      <Button
        data-testid="return-home-button"
        variant="contained"
        onClick={onClickHome}
      >
        Return home
      </Button>

      <Button
        data-testid="return-home-button"
        variant="contained"
        onClick={onClickLobby}
      >
        Back to lobby
      </Button>

      <Button
        data-testid="report-issue-button"
        variant="contained"
        color="error"
        onClick={() => {
          Gleap.startFeedbackFlow('bugreporting');
        }}
      >
        Report an issue
      </Button>
    </Stack>
  </Stack>
);

export const LoadingScreen = () => (
  <div className=" str-video str-video__call">
    <div className="str-video__call__loading-screen">
      <LoadingIndicator />
    </div>
  </div>
);
