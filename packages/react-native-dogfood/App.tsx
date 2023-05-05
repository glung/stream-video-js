import * as React from 'react';
import { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  LoginStackParamList,
  MeetingStackParamList,
  RingingStackParamList,
  RootStackParamList,
} from './types';
import LoginScreen from './src/screens/LoginScreen';
import { NavigationHeader } from './src/components/NavigationHeader';
import { useAuth } from './src/hooks/useAuth';
import AuthenticatingProgressScreen from './src/screens/AuthenticatingProgress';
import {
  prontoCallId$,
  useProntoLinkEffect,
} from './src/hooks/useProntoLinkEffect';
import {
  IncomingCallView,
  LobbyView,
  OutgoingCallView,
  StreamVideoCall,
} from '@stream-io/video-react-native-sdk';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from './src/contexts/AppContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MeetingScreen } from './src/screens/Meeting/MeetingScreen';
import { CallScreen } from './src/screens/Call/CallScreen';
import JoinMeetingScreen from './src/screens/Meeting/JoinMeetingScreen';
import JoinCallScreen from './src/screens/Call/JoinCallScreen';
import { ChooseFlowScreen } from './src/screens/ChooseFlowScreen';
import { CallParticipantsInfoScreen } from './src/screens/Meeting/CallParticipantsInfoScreen';
import {
  setFirebaseHandler,
  setForegroundService,
} from './src/modules/push/android';
import { useIosPushEffect } from './src/hooks/useIosPushEffect';
import { Platform } from 'react-native';
import { useCallKeepEffect } from './src/hooks/useCallkeepEffect';
import { navigationRef } from './src/utils/staticNavigationUtils';
import translations from './src/translations';

import Logger from 'react-native-webrtc/src/Logger';
import { v4 as uuidv4 } from 'uuid';

// @ts-expect-error
Logger.enable(false);

const Stack = createNativeStackNavigator<RootStackParamList>();
const LoginStack = createNativeStackNavigator<LoginStackParamList>();
const MeetingStack = createNativeStackNavigator<MeetingStackParamList>();
const RingingStack = createNativeStackNavigator<RingingStackParamList>();

if (Platform.OS === 'android') {
  setFirebaseHandler();
  setForegroundService();
}

const Meeting = () => {
  return (
    <MeetingStack.Navigator>
      <MeetingStack.Screen
        name="JoinMeetingScreen"
        component={JoinMeetingScreen}
        options={{ header: NavigationHeader }}
      />
      <MeetingStack.Screen
        name="LobbyViewScreen"
        component={LobbyView}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="MeetingScreen"
        component={MeetingScreen}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="CallParticipantsInfoScreen"
        component={CallParticipantsInfoScreen}
      />
    </MeetingStack.Navigator>
  );
};

const Ringing = () => {
  return (
    <RingingStack.Navigator>
      <RingingStack.Screen
        name="JoinCallScreen"
        component={JoinCallScreen}
        options={{ header: NavigationHeader }}
      />
      <RingingStack.Screen
        name="CallScreen"
        component={CallScreen}
        options={{ headerShown: false }}
      />
      <RingingStack.Screen
        name="IncomingCallScreen"
        component={IncomingCallView}
        options={{ headerShown: false }}
      />
      <RingingStack.Screen
        name="OutgoingCallScreen"
        component={OutgoingCallView}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="CallParticipantsInfoScreen"
        component={CallParticipantsInfoScreen}
      />
    </RingingStack.Navigator>
  );
};

const Login = () => {
  const setState = useAppGlobalStoreSetState();
  const loginNavigation =
    useNavigation<NativeStackNavigationProp<LoginStackParamList>>();
  React.useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({ appMode: 'Meeting' });
        loginNavigation.navigate('LoginScreen');
      }
    });
    return () => subscription.unsubscribe();
  }, [setState, loginNavigation]);
  return (
    <LoginStack.Navigator>
      <LoginStack.Screen
        name="ChooseFlowScreen"
        component={ChooseFlowScreen}
        options={{ headerShown: false }}
      />
      <LoginStack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </LoginStack.Navigator>
  );
};

const StackNavigator = () => {
  const appMode = useAppGlobalStoreValue((store) => store.appMode);
  const callId = useAppGlobalStoreValue((store) => store.callId);
  const setState = useAppGlobalStoreSetState();
  const { authenticationInProgress } = useAuth();
  const callNavigation =
    useNavigation<NativeStackNavigationProp<RingingStackParamList>>();
  const meetingNavigation =
    useNavigation<NativeStackNavigationProp<MeetingStackParamList>>();
  const setRandomCallId = React.useCallback(() => {
    setState({
      callId: uuidv4().toLowerCase(),
    });
  }, [setState]);
  useProntoLinkEffect();
  useIosPushEffect();
  useCallKeepEffect();

  useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({
          callId: prontoCallId,
        });
        prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
      }
    });
    if (appMode === 'Ringing') {
      setRandomCallId();
    }

    return () => subscription.unsubscribe();
  }, [appMode, setRandomCallId, setState]);

  const onCallJoined = React.useCallback(() => {
    if (appMode === 'Meeting') {
      meetingNavigation.navigate('MeetingScreen');
    } else {
      callNavigation.navigate('CallScreen');
    }
  }, [appMode, callNavigation, meetingNavigation]);

  const onCallIncoming = React.useCallback(() => {
    callNavigation.navigate('IncomingCallScreen');
  }, [callNavigation]);

  const onCallOutgoing = React.useCallback(() => {
    callNavigation.navigate('OutgoingCallScreen');
  }, [callNavigation]);

  const onCallHungUp = React.useCallback(() => {
    if (appMode === 'Meeting') {
      meetingNavigation.navigate('JoinMeetingScreen');
    } else {
      callNavigation.navigate('JoinCallScreen');
      setRandomCallId();
    }
  }, [appMode, callNavigation, meetingNavigation, setRandomCallId]);

  const onCallRejected = React.useCallback(() => {
    callNavigation.navigate('JoinCallScreen');
    setRandomCallId();
  }, [callNavigation, setRandomCallId]);

  const callCycleHandlers = React.useMemo(() => {
    return {
      onCallJoined,
      onCallIncoming,
      onCallOutgoing,
      onCallHungUp,
      onCallRejected,
    };
  }, [
    onCallJoined,
    onCallIncoming,
    onCallOutgoing,
    onCallHungUp,
    onCallRejected,
  ]);

  const { videoClient } = useAuth();
  if (!videoClient) {
    return <Login />;
  }

  if (authenticationInProgress) {
    return <AuthenticatingProgressScreen />;
  }

  return (
    <StreamVideoCall
      callId={callId}
      callCycleHandlers={callCycleHandlers}
      client={videoClient}
      translationsOverrides={translations}
    >
      <Stack.Navigator>
        {appMode === 'Meeting' ? (
          <Stack.Screen
            name="Meeting"
            component={Meeting}
            options={{ headerShown: false }}
          />
        ) : appMode === 'Ringing' ? (
          <Stack.Screen
            name="Ringing"
            component={Ringing}
            options={{ headerShown: false }}
          />
        ) : null}
      </Stack.Navigator>
    </StreamVideoCall>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppGlobalContextProvider>
        <NavigationContainer ref={navigationRef}>
          <StackNavigator />
        </NavigationContainer>
      </AppGlobalContextProvider>
    </SafeAreaProvider>
  );
}
