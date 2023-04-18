import {
  StreamVideoReadOnlyStateStore,
  StreamVideoWriteableStateStore,
} from './store';
import {
  CreateCallTypeRequest,
  CreateCallTypeResponse,
  GetCallTypeResponse,
  GetEdgesResponse,
  ListCallTypeResponse,
  QueryCallsRequest,
  QueryCallsResponse,
  SortParamRequest,
  UpdateCallTypeRequest,
  UpdateCallTypeResponse,
} from './gen/coordinator';
import { Call } from './rtc/Call';

import {
  watchCallAccepted,
  watchCallCancelled,
  watchCallRejected,
} from './events';
import {
  EventHandler,
  EventTypes,
  StreamClientOptions,
  StreamVideoEvent,
  TokenOrProvider,
  User,
} from './coordinator/connection/types';
import { StreamClient } from './coordinator/connection/client';

/**
 * A `StreamVideoClient` instance lets you communicate with our API, and authenticate users.
 */
export class StreamVideoClient {
  /**
   * A reactive store that exposes all the state variables in a reactive manner - you can subscribe to changes of the different state variables. Our library is built in a way that all state changes are exposed in this store, so all UI changes in your application should be handled by subscribing to these variables.
   * @angular If you're using our Angular SDK, you shouldn't be interacting with the state store directly, instead, you should be using the [`StreamVideoService`](./StreamVideoService.md).
   */
  readonly readOnlyStateStore: StreamVideoReadOnlyStateStore;
  private readonly writeableStateStore: StreamVideoWriteableStateStore;
  streamClient: StreamClient;

  /**
   * You should create only one instance of `StreamVideoClient`.
   * @angular If you're using our Angular SDK, you shouldn't be calling the `constructor` directly, instead you should be using [`StreamVideoService`](./StreamVideoService.md/#init).
   * @param apiKey your Stream API key
   * @param opts the options for the client.
   */
  constructor(apiKey: string, opts?: StreamClientOptions) {
    this.streamClient = new StreamClient(apiKey, {
      // FIXME: OL: fix SSR.
      browser: true,
      persistUserOnConnectionFailure: true,
      ...opts,
    });

    this.writeableStateStore = new StreamVideoWriteableStateStore();
    this.readOnlyStateStore = new StreamVideoReadOnlyStateStore(
      this.writeableStateStore,
    );
  }

  /**
   * Connects the given user to the client.
   * Only one user can connect at a time, if you want to change users, call `disconnectUser` before connecting a new user.
   * If the connection is successful, the connected user [state variable](#readonlystatestore) will be updated accordingly.
   *
   * @param user the user to connect.
   * @param tokenOrProvider a token or a function that returns a token.
   */
  connectUser = async (user: User, tokenOrProvider: TokenOrProvider) => {
    await this.streamClient.connectUser(
      // @ts-expect-error
      user,
      tokenOrProvider,
    );

    // FIXME: OL: unregister the event listeners.
    this.on('call.created', (event: StreamVideoEvent) => {
      if (event.type !== 'call.created') return;
      const { call, members, ringing } = event;

      if (user.id === call.created_by.id) {
        console.warn('Received CallCreatedEvent sent by the current user');
        return;
      }

      this.writeableStateStore.setPendingCalls((pendingCalls) => [
        ...pendingCalls,
        new Call({
          streamClient: this.streamClient,
          type: call.type,
          id: call.id,
          metadata: call,
          members,
          ringing,
          clientStore: this.writeableStateStore,
        }),
      ]);
    });
    this.on('call.accepted', watchCallAccepted(this.writeableStateStore));
    this.on('call.rejected', watchCallRejected(this.writeableStateStore));
    this.on('call.ended', watchCallCancelled(this.writeableStateStore));

    this.writeableStateStore.setConnectedUser(user);
  };

  /**
   * Disconnects the currently connected user from the client.
   *
   * If the connection is successfully disconnected, the connected user [state variable](#readonlystatestore) will be updated accordingly
   *
   * @param timeout Max number of ms, to wait for close event of websocket, before forcefully assuming successful disconnection.
   *                https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
   */
  disconnectUser = async (timeout?: number) => {
    await this.streamClient.disconnectUser(timeout);
    this.writeableStateStore.pendingCalls.forEach((call) =>
      call.cancelScheduledDrop(),
    );
    this.writeableStateStore.setConnectedUser(undefined);
  };

  /**
   * You can subscribe to WebSocket events provided by the API.
   * To remove a subscription, call the `off` method or, execute the returned unsubscribe function.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive [state store](#readonlystatestore).
   *
   * @param eventName the event name or 'all'.
   * @param callback the callback which will be called when the event is emitted.
   * @returns an unsubscribe function.
   */
  on = (eventName: EventTypes, callback: EventHandler) => {
    return this.streamClient.on(eventName, callback);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   *
   * @param event the event name.
   * @param callback the callback which was passed to the `on` method.
   */
  off = (event: string, callback: EventHandler) => {
    return this.streamClient.off(event, callback);
  };

  call(type: string, id: string) {
    return new Call({
      streamClient: this.streamClient,
      id,
      type,
      clientStore: this.writeableStateStore,
    });
  }

  queryCalls = async (
    filterConditions: { [key: string]: any },
    sort: Array<SortParamRequest>,
    limit?: number,
    next?: string,
    watch?: boolean,
  ) => {
    const data: QueryCallsRequest = {
      filter_conditions: filterConditions,
      sort: sort,
      limit: limit,
      next: next,
      watch,
    };
    try {
      if (data.watch) {
        await this.streamClient.connectionIdPromise;
      }
      const response = await this.streamClient.post<QueryCallsResponse>(
        '/calls',
        data,
      );
      const calls = response.calls.map(
        (c) =>
          new Call({
            streamClient: this.streamClient,
            id: c.call.id,
            type: c.call.type,
            metadata: c.call,
            members: c.members,
            clientStore: this.writeableStateStore,
          }),
      );
      return {
        ...response,
        calls: calls,
      };
    } catch (error) {
      throw error;
    }
  };

  queryUsers = async () => {
    console.log('Querying users is not implemented yet.');
  };

  edges = async () => {
    return this.streamClient.get<GetEdgesResponse>(`/edges`);
  };

  // server-side only endpoints
  createCallType = async (data: CreateCallTypeRequest) => {
    return this.streamClient.post<CreateCallTypeResponse>(`/calltypes`, data);
  };

  getCallType = async (name: string) => {
    return this.streamClient.get<GetCallTypeResponse>(`/calltypes/${name}`);
  };

  updateCallType = async (name: string, data: UpdateCallTypeRequest) => {
    return this.streamClient.put<UpdateCallTypeResponse>(
      `/calltypes/${name}`,
      data,
    );
  };

  deleteCallType = async (name: string) => {
    return this.streamClient.delete(`/calltypes/${name}`);
  };

  listCallTypes = async () => {
    return this.streamClient.get<ListCallTypeResponse>(`/calltypes`);
  };
}
