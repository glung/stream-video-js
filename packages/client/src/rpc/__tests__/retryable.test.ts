import { describe, expect, it, vi } from 'vitest';
import { createSignalClient } from '../';
import { retryable, RetryPolicy } from '../retryable';
import { SetPublisherRequest } from '../../gen/video/sfu/signal_rpc/signal';

const superFastRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  minDelayInMs: 5,
  maxDelayInMs: 25,
};

describe('retryable', () => {
  it('should retry until it succeeds', async () => {
    const rpc = createSignalClient();
    vi.spyOn(rpc, 'setPublisher').mockImplementation(
      // @ts-ignore
      (() => {
        let executionCount = 0;
        return async () => {
          if (executionCount++ < 3) throw new Error('error');
          return {
            response: { sdp: 'sdp', sessionId: 'sessionId', iceRestart: false },
          };
        };
      })(),
    );

    const retryableTask = retryable(
      async (data: SetPublisherRequest) => rpc.setPublisher(data),
      superFastRetryPolicy,
    );

    const result = await retryableTask({
      sdp: 'sdp',
      sessionId: 'sessionId',
      tracks: [],
    });

    expect(result).toEqual({
      response: { sdp: 'sdp', sessionId: 'sessionId', iceRestart: false },
    });
  });

  it('should throw if it fails after max retries', async () => {
    const rpc = createSignalClient();
    vi.spyOn(rpc, 'setPublisher').mockImplementation(() => {
      throw new Error('error');
    });

    const retryableTask = retryable(
      async (data: SetPublisherRequest) => rpc.setPublisher(data),
      superFastRetryPolicy,
    );

    await expect(
      retryableTask({
        sdp: 'sdp',
        sessionId: 'sessionId',
        tracks: [],
      }),
    ).rejects.toThrow('error');
    expect(rpc.setPublisher).toHaveBeenCalledTimes(4);
  });
});
