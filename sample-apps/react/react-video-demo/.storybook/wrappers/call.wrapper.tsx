import React, { FC, useCallback, useEffect, useState, ReactNode } from 'react';
import { v1 as uuidv1 } from 'uuid';

import {
  adjectives,
  Config,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import {
  MediaDevicesProvider,
  StreamCallProvider,
  StreamVideo,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';

import { ModalProvider } from '../../src/contexts/ModalContext';
import { NotificationProvider } from '../../src/contexts/NotificationsContext';
import { PanelProvider } from '../../src/contexts/PanelContext';

import { generateUser } from '../../src/utils/useGenerateUser';
import { useCreateStreamChatClient } from '../../src/hooks/useChatClient';

export type Props = {
  logo: string;
  user: User;
  token: string;
  apiKey: string;
  incomingCallId?: string | null;
  children: ReactNode;
};

const config: Config = {
  dictionaries: [adjectives],
  separator: '-',
  style: 'lowerCase',
};

const Init: FC<Props> = ({
  incomingCallId,
  logo,
  user,
  token,
  apiKey,
  children,
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isjoiningCall, setIsJoiningCall] = useState(false);
  const [client] = useState(() => new StreamVideoClient(apiKey));

  useEffect(() => {
    client.connectUser(user, token).catch(console.error);

    return () => {
      client.disconnectUser();
    };
  }, [client, user, token]);

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: {
      id: user.id,
      name: user.name,
      image: user.image,
    },
  });

  const callType: string = 'default';
  const [callId] = useState(() => {
    if (incomingCallId) return incomingCallId;
    const id = `${uniqueNamesGenerator(config)}-${uuidv1().split('-')[0]}`;
    window.location.search = `?id=${id}`;
    return id;
  });
  const [activeCall] = useState(() => client.call(callType, callId));

  useEffect(() => {
    joinMeeting();
  }, []);

  const joinMeeting = useCallback(async () => {
    setIsJoiningCall(true);
    try {
      await activeCall.join({ create: true });

      setIsCallActive(true);
      setIsJoiningCall(false);
    } catch (e) {
      console.error(e);
    }
  }, [activeCall]);

  return (
    <StreamVideo client={client}>
      <StreamCallProvider call={activeCall}>
        <MediaDevicesProvider initialVideoEnabled={true}>
          <ModalProvider>
            <NotificationProvider>
              <PanelProvider>{children}</PanelProvider>
            </NotificationProvider>
          </ModalProvider>
        </MediaDevicesProvider>
      </StreamCallProvider>
    </StreamVideo>
  );
};

const App: FC = () => {
  const logo = `${import.meta.env.BASE_URL}images/icons/stream-logo.svg`;
  const [user, setUser] = useState<User>();
  const [token, setToken] = useState<string>();

  const location = window?.document?.location;
  const callId = new URL(location.href).searchParams.get('id');

  useEffect(() => {
    async function fetchUser() {
      const response = await generateUser(
        callId ? 'user' : 'admin',
        '@stream-io/video-demo',
      );
      setUser(response.user);
      setToken(response.token);
    }
    fetchUser();
  }, []);

  if (user && token) {
    return (
      <Init
        apiKey={import.meta.env.VITE_STREAM_KEY}
        user={user}
        token={token}
        logo={logo}
        incomingCallId={callId}
      />
    );
  }

  return null;
};

export default App;
