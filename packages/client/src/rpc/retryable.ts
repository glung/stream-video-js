import { FinishedUnaryCall } from '@protobuf-ts/runtime-rpc';
import { Error as SfuError } from '../gen/video/sfu/models/models';
import { retryInterval, sleep } from '../coordinator/connection/utils';
import { Logger } from '../coordinator/connection/types';
import { getLogger } from '../logger';

const logger: Logger = getLogger(['sfu-client', 'retryable']);

/**
 * An internal interface which asserts that "retryable" SFU responses
 * contain a field called "error".
 * Ideally, this should be coming from the Protobuf definitions.
 */
interface SfuResponseWithError {
  /**
   * An optional error field which should be present in all SFU responses.
   */
  error?: SfuError;
}

/**
 * Defines the retry policy to use for retryable RPC calls.
 */
export interface RetryPolicy {
  /**
   * The maximum number of retries to attempt.
   */
  maxRetries: number;
  /**
   * The minimum delay between each retry in milliseconds.
   */
  minDelayInMs: number;
  /**
   * The maximum delay between each retry in milliseconds.
   */
  maxDelayInMs: number;
}

export const fastAndSimpleRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  minDelayInMs: 250,
  maxDelayInMs: 500,
};

export const neverGonnaGiveYouUpRetryPolicy: RetryPolicy = {
  maxRetries: 30,
  minDelayInMs: 500,
  maxDelayInMs: 2500,
};

/**
 * The type definition of a retryable task.
 */
export type RetryableTask<T, R> = (input: T) => Promise<R>;

/**
 * Creates a closure which wraps the given RPC call and retries invoking
 * the RPC until it succeeds or the maximum number of retries is reached.
 *
 * Between each retry, there would be a random delay in order to avoid
 * request bursts towards the SFU.
 *
 * @param task the RPC call to execute.
 * @param retryPolicy the retry policy to use.
 * @param <R> the type of the RPC call result.
 * @param <T> the type of the input object.
 * @param <I> the type of the request object.
 * @param <O> the type of the response object.
 */
export const retryable = <
  R extends FinishedUnaryCall<I, O>, // the type of the RPC call result.
  T extends object, // inferred type of the input object
  I extends object, // the type of the request object.
  O extends SfuResponseWithError, // the type of the response object.
>(
  task: RetryableTask<T, R>,
  retryPolicy: RetryPolicy,
): RetryableTask<T, R> => {
  return async function withRetryable(input: T) {
    let retryAttempt = 0;
    let result: R | undefined;

    do {
      // don't delay the first invocation
      if (retryAttempt > 0) {
        const delay = retryInterval(
          retryAttempt,
          retryPolicy.minDelayInMs,
          retryPolicy.maxDelayInMs,
        );
        await sleep(delay);
      }

      try {
        result = await task(input);

        // if the RPC call failed, log the error and retry
        if (result.response.error) {
          logger('error', 'SFU RPC Error:', result.response.error);
        }
      } catch (e) {
        if (retryAttempt >= retryPolicy.maxRetries) {
          logger('debug', 'SFU RPC error, not retrying...', e);
          throw e;
        }
        logger('debug', `SFU RPC error, retrying... ${retryAttempt}`, e);
      }

      retryAttempt++;
    } while (!result || result.response.error?.shouldRetry);

    return result;
  };
};
