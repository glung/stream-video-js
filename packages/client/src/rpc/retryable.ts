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
  retryPolicy: RetryPolicy = {
    maxRetries: 5,
    minDelayInMs: 250,
    maxDelayInMs: 500,
  },
): RetryableTask<T, R> => {
  return async function withRetryable(input: T) {
    let retryAttempt = 0;
    let result: R | undefined;

    while (!result || result.response.error?.shouldRetry) {
      // don't delay the first invocation
      if (retryAttempt > 0) {
        await sleep(
          retryInterval(
            retryAttempt,
            retryPolicy.minDelayInMs,
            retryPolicy.maxDelayInMs,
          ),
        );
      }

      try {
        result = await task(input);

        // if the RPC call failed, log the error and retry
        if (result.response.error) {
          logger('error', 'SFU RPC Error:', result.response.error);
        }
      } catch (e) {
        if (retryAttempt >= retryPolicy.maxRetries) {
          throw e;
        }
        logger('debug', `SFU RPC error, retrying... ${retryAttempt}`, e);
      }

      retryAttempt++;
    }
    return result;
  };
};
