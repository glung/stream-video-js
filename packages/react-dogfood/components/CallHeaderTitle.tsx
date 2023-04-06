import {
  useActiveCall,
  useCallCallingState,
  useConnectedUser,
  useRemoteParticipants,
} from '@stream-io/video-react-sdk';
import { useMemo } from 'react';
import { HomeButton } from './LobbyHeader';

type CallTitleProps = {
  title?: string;
};

export const CallHeaderTitle = ({ title }: CallTitleProps) => {
  const activeCall = useActiveCall();
  const connectedUser = useConnectedUser();
  const remoteParticipants = useRemoteParticipants();
  const callingState = useCallCallingState();

  const standInTitle = useMemo(() => {
    if (!connectedUser) return 'Connecting...';

    if (!remoteParticipants.length) return connectedUser.name;
    return (
      'Call with: ' +
      remoteParticipants
        .slice(0, 3)
        .map((p) => p.name || p.userId)
        .join(', ')
    );
  }, [connectedUser, remoteParticipants]);

  if (!activeCall) return null;

  return (
    <div className="str-video__call-header__title-group">
      <HomeButton />
      {/* FIXME OL: switch to a nicer indicator */}
      <span>{callingState}</span>
      <h4 className="str-video__call-header-title">{title || standInTitle}</h4>
    </div>
  );
};
