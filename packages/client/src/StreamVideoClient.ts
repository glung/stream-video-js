import {
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './stateStore';
import type { Call as CallMeta } from './gen/video/coordinator/call_v1/call';
import type {
  CreateCallRequest,
  GetOrCreateCallRequest,
  JoinCallRequest,
  ReportCallStatEventRequest,
  ReportCallStatEventResponse,
  ReportCallStatsRequest,
  ReportCallStatsResponse,
} from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { UserEventType } from './gen/video/coordinator/client_v1_rpc/client_rpc';
import { ClientRPCClient } from './gen/video/coordinator/client_v1_rpc/client_rpc.client';
import type {
  Edge,
  ICEServer,
  Latency,
} from './gen/video/coordinator/edge_v1/edge';
import type { UserInput } from './gen/video/coordinator/user_v1/user';
import {
  createCoordinatorClient,
  measureResourceLoadLatencyTo,
  StreamVideoClientOptions,
  withHeaders,
} from './rpc';
import {
  createSocketConnection,
  StreamEventListener,
  StreamWSClient,
} from './ws';
import { StreamSfuClient } from './StreamSfuClient';
import { Call } from './rtc/Call';
import { registerWSEventHandlers } from './ws/callUserEventHandlers';
import {
  WebsocketClientEvent,
  WebsocketHealthcheck,
} from './gen/video/coordinator/client_v1_rpc/websocket';
import { reportStats } from './stats/coordinator-stats-reporter';
import { Timestamp } from './gen/google/protobuf/timestamp';

const defaultOptions: Partial<StreamVideoClientOptions> = {
  coordinatorRpcUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
  coordinatorWsUrl:
    'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
  sendJson: false,
  latencyMeasurementRounds: 3,
};

/**
 * A `StreamVideoClient` instance lets you communicate with our API, and sign in with the current user.
 */
export class StreamVideoClient {
  /**
   * A reactive store that exposes the state variables in a reactive manner - you can subscribe to changes of the different state variables.
   * @angular If you're using our Angular SDK, you shouldn't be interacting with the state store directly, instead, you should be using the [`StreamVideoService`](./StreamVideoService.md).
   */
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  // Make it public temporary to ease SDK transition
  readonly writeableStateStore: StreamVideoWriteableStateStore;
  private client: ClientRPCClient;
  private options: StreamVideoClientOptions;
  private ws: StreamWSClient | undefined;
  // TODO: this should come from the store
  private activeCallId?: string;

  /**
   * You should create only one instance of `StreamVideoClient`.
   * @angular If you're using our Angular SDK, you shouldn't be calling the `constructor` directly, instead you should be using [`StreamVideoClient` service](./StreamVideoClient.md).
   * @param apiKey your Stream API key
   * @param opts
   */
  constructor(apiKey: string, opts: StreamVideoClientOptions) {
    const options = {
      ...defaultOptions,
      ...opts,
    };
    this.options = options;
    const { token } = options;
    const authToken = typeof token === 'function' ? token() : token;
    this.client = createCoordinatorClient({
      baseUrl: options.coordinatorRpcUrl || '/',
      sendJson: options.sendJson,
      interceptors: [
        withHeaders({
          api_key: apiKey,
          Authorization: `Bearer ${authToken}`,
        }),
      ],
    });

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );
    reportStats(
      this.readOnlyStateStore,
      (e) => this.reportCallStats(e),
      (e) => this.reportCallStatEvent(e),
    );
  }

  /**
   * Connects the given user to the client.
   * Only one user can connect at a time, if you want to change users, call `disconnect` before connecting a new user.
   * If the connection is successful, the connected user state variable will be updated accordingly.
   * @param apiKey
   * @param token
   * @param user
   * @returns
   */
  connect = async (apiKey: string, token: string, user: UserInput) => {
    if (this.ws) return;
    this.ws = await createSocketConnection(
      this.options.coordinatorWsUrl!,
      apiKey,
      token,
      user,
    );
    if (this.ws) {
      registerWSEventHandlers(this, this.writeableStateStore);
    }
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      user,
    );
  };

  /**
   * Disconnects the currently connected user from the client.
   *
   * If the connection is successfully disconnected, the connected user state variable will be updated accordingly
   * @returns
   */
  disconnect = async () => {
    if (!this.ws) return;
    this.ws.disconnect();
    this.ws = undefined;
    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.connectedUserSubject,
      undefined,
    );
  };

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive state store.
   * @param event
   * @param fn
   * @returns
   */
  on = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.on(event, fn);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   * @param event
   * @param fn
   * @returns
   */
  off = <T>(event: string, fn: StreamEventListener<T>) => {
    return this.ws?.off(event, fn);
  };

  /**
   *
   * @param hc
   *
   * @deprecated We should move this functionality inside the client and make this an internal function.
   */
  setHealthcheckPayload = (hc: WebsocketHealthcheck) => {
    this.ws?.keepAlive.setPayload(
      WebsocketClientEvent.toBinary({
        event: {
          oneofKind: 'healthcheck',
          healthcheck: hc,
        },
      }),
    );
  };

  /**
   * Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, it will return the existing call.
   * @param data
   * @returns A call metadata with information about the call.
   */
  getOrCreateCall = async (data: GetOrCreateCallRequest) => {
    const { response } = await this.client.getOrCreateCall(data);
    if (response.call) {
      return response.call;
    } else {
      // TODO: handle error?
      return undefined;
    }
  };

  /**
   * Allows you to create new calls with the given parameters. If a call with the same combination of type and id already exists, this will return an error.
   * @param data
   * @returns A call metadata with information about the call.
   */
  createCall = async (data: CreateCallRequest) => {
    const callToCreate = await this.client.createCall(data);
    const { call: callEnvelope } = callToCreate.response;
    return callEnvelope;
  };

  acceptCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.ACCEPTED_CALL,
    });
  };

  rejectCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.REJECTED_CALL,
    });
  };

  cancelCall = async (callCid: string) => {
    await this.client.sendEvent({
      callCid,
      eventType: UserEventType.CANCELLED_CALL,
    });
  };

  /**
   * Allows you to create a new call with the given parameters and joins the call immediately. If a call with the same combination of `type` and `id` already exists, it will join the existing call.
   * @param data
   * @param sessionId
   * @returns A [`Call`](./Call.md) instance that can be used to interact with the call.
   */
  joinCall = async (data: JoinCallRequest, sessionId?: string) => {
    const { response } = await this.client.joinCall(data);
    if (response.call && response.call.call && response.edges) {
      const edge = await this.getCallEdgeServer(
        response.call.call,
        response.edges,
      );
      if (data.input?.ring) {
        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.activeRingCallMetaSubject,
          response.call.call,
        );
        this.writeableStateStore.setCurrentValue(
          this.writeableStateStore.activeRingCallDetailsSubject,
          response.call.details,
        );
      }
      if (edge.credentials && edge.credentials.server) {
        const edgeName = edge.credentials.server.edgeName;
        const selectedEdge = response.edges.find((e) => e.name === edgeName);
        const { server, iceServers, token } = edge.credentials;
        const sfuClient = new StreamSfuClient(server.url, token, sessionId);
        this.activeCallId = response.call?.call?.callCid;
        return new Call(
          sfuClient,
          {
            connectionConfig: this.toRtcConfiguration(iceServers),
            latencyCheckUrl: selectedEdge?.latencyUrl,
            edgeName,
          },
          this.writeableStateStore,
        );
      } else {
        // TODO: handle error?
        return undefined;
      }
    } else {
      // TODO: handle error?
      return undefined;
    }
  };

  startRecording = async (callId: string, callType: string) => {
    await this.client.startRecording({
      callId,
      callType,
    });

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.callRecordingInProgressSubject,
      true,
    );
  };

  stopRecording = async (callId: string, callType: string) => {
    await this.client.stopRecording({
      callId,
      callType,
    });

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.callRecordingInProgressSubject,
      false,
    );
  };

  /**
   * Reports call WebRTC metrics to coordinator API
   * @param stats
   * @returns
   */
  private reportCallStats = async (
    stats: Object,
  ): Promise<ReportCallStatsResponse> => {
    // const callCid = this.writeableStateStore.getCurrentValue(
    //   this.writeableStateStore.activeRingCallMetaSubject,
    // )?.callCid;
    const callCid = this.activeCallId;
    if (!callCid) {
      throw new Error('No active CallMeta ID found');
    }
    const request: ReportCallStatsRequest = {
      callCid,
      statsJson: new TextEncoder().encode(JSON.stringify(stats)),
    };
    const response = await this.client.reportCallStats(request);
    return response.response;
  };

  private getCallEdgeServer = async (call: CallMeta, edges: Edge[]) => {
    const latencyByEdge: { [e: string]: Latency } = {};
    await Promise.all(
      edges.map(async (edge) => {
        latencyByEdge[edge.name] = {
          measurementsSeconds: await measureResourceLoadLatencyTo(
            edge.latencyUrl,
            Math.max(this.options.latencyMeasurementRounds || 0, 3),
          ),
        };
      }),
    );

    const edgeServer = await this.client.getCallEdgeServer({
      callCid: call.callCid,
      // TODO: OL: check the double wrapping
      measurements: {
        measurements: latencyByEdge,
      },
    });

    return edgeServer.response;
  };

  private toRtcConfiguration = (config?: ICEServer[]) => {
    if (!config || config.length === 0) return undefined;
    const rtcConfig: RTCConfiguration = {
      iceServers: config.map((ice) => ({
        urls: ice.urls,
        username: ice.username,
        credential: ice.password,
      })),
    };
    return rtcConfig;
  };

  /**
   * Reports call events (for example local participant muted themselves) to the coordinator API
   * @param statEvent
   * @returns
   */
  private reportCallStatEvent = async (
    statEvent: ReportCallStatEventRequest['event'],
  ): Promise<ReportCallStatEventResponse> => {
    // const callCid = this.writeableStateStore.getCurrentValue(
    //   this.writeableStateStore.activeRingCallMetaSubject,
    // )?.callCid;
    const callCid = this.activeCallId;
    if (!callCid) {
      throw new Error('No active CallMeta ID found');
    }
    const request: ReportCallStatEventRequest = {
      callCid,
      timestamp: Timestamp.fromDate(new Date()),
      event: statEvent,
    };
    const response = await this.client.reportCallStatEvent(request);
    return response.response;
  };

  /**
   * Sets the participant.isPinned value.
   * @param sessionId the session id of the participant
   * @param isPinned the value to set the participant.isPinned
   * @returns
   */
  setParticipantIsPinned = (sessionId: string, isPinned: boolean): void => {
    const participants = this.writeableStateStore.getCurrentValue(
      this.writeableStateStore.activeCallAllParticipantsSubject,
    );

    this.writeableStateStore.setCurrentValue(
      this.writeableStateStore.activeCallAllParticipantsSubject,
      participants.map((p) => {
        return p.sessionId === sessionId
          ? {
              ...p,
              isPinned,
            }
          : p;
      }),
    );
  };
}
