import { useRouter } from 'next/router';
import { authOptions } from '../api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth';
import { GetServerSidePropsContext } from 'next';
import { createToken } from '../../helpers/jwt';
import {
  StreamVideo,
  StreamMeeting,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
import { User } from '@stream-io/video-client';

import { useCreateStreamChatClient } from '../../hooks';
import { MeetingUI } from '../../components';

type JoinCallProps = {
  user: User;
  userToken: string;
  apiKey: string;
  userImageUrl: string | null;
};

const JoinCall = (props: JoinCallProps) => {
  const router = useRouter();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';

  const { userToken, user, apiKey, userImageUrl } = props;

  const client = useCreateStreamVideoClient({
    apiKey,
    token: userToken,
    user,
  });

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: {
      ...user,
      image: userImageUrl,
    },
  });

  if (!client) {
    return <h2>Connecting...</h2>;
  }

  return (
    <div style={{ flexGrow: 1, minHeight: 0 }}>
      <Head>
        <title>Stream Calls: {callId}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <StreamVideo client={client}>
        <StreamMeeting callId={callId} callType={callType}>
          <MeetingUI chatClient={chatClient} />
        </StreamMeeting>
      </StreamVideo>
    </div>
  );
};

export default JoinCall;

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions,
  );

  if (!session) {
    const url = context.req.url;
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=${url}`,
      },
    };
  }

  const apiKey = process.env.STREAM_API_KEY as string;
  const secretKey = process.env.STREAM_SECRET_KEY as string;

  const userName = (
    (context.query[`user_id`] as string) || session.user!.email!
  ).replaceAll(' ', '_'); // Otherwise, SDP parse errors with MSID

  // Chat does not allow for Id's to include special characters
  // a-z, 0-9, @, _ and - are allowed
  const streamUserId = userName.replace(/[^_\-0-9a-zA-Z@]/g, '_');

  return {
    props: {
      apiKey,
      userToken: createToken(streamUserId, secretKey),
      user: {
        id: streamUserId,
        name: userName,
        role: 'admin',
        teams: ['stream-io'],
      },
      // moved it here as this is no longer part of the user
      userImageUrl: session.user?.image,
    } as JoinCallProps,
  };
};
