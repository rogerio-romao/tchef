import type { BaseSchema } from 'valibot';

export type HTTPVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type ResponseFormat = 'json' | 'text' | 'blob';

/**
 * Options for the Tchef function
 *
 * @param method - HTTP method to use (default: 'GET') valid values are 'GET', 'POST', 'PUT', 'DELETE'
 * @param body - Body to send in the request
 * @param headers - Headers to send in the request
 * @param responseFormat - Format of the response (default: 'json') valid values are 'json', 'text', 'blob'
 * @param cacheType - Cache type header to use (default: 'no-cache') valid values are 'no-cache', 'private', 'public'
 * @param cacheMaxAge - Cache max age in seconds
 * @param searchParams - Search params object to add to the URL
 * @param timeoutSecs - Timeout in seconds (default: 'no-limit') valid values are 'no-limit' or a number bigger than 0
 * @param signal - Abort signal to cancel the request
 * @param retries - Number of retries to do in case of failure (default: 0)
 * @param retryDelayMs - Delay in milliseconds between retries (default: 100), can be 'exponential' to increase the delay exponentially with each retry starting from 1 second
 * @param validateSchema - Valibot Schema to validate the response data
 */
export type TchefOptions = {
    method?: HTTPVerb;
    body?: string;
    headers?: Record<string, string>;
    responseFormat?: ResponseFormat;
    cacheType?: 'no-cache' | 'private' | 'public';
    cacheMaxAge?: number;
    searchParams?: Record<string, string | number>;
    timeoutSecs?: 'no-limit' | number;
    signal?: AbortSignal;
    retries?: number;
    retryDelayMs?: number | 'exponential';
    validateSchema?: BaseSchema;
};

/**
 * Result of the Tchef function
 *
 * Depending on the success of the request, the result will have either the 'data' or 'error' property,
 * and the 'ok' property will be true or false respectively.
 *
 * @param ok - True if the request was successful, false otherwise
 * @param data - Data returned by the request
 * @param error - Error message in case of failure
 * @param statusCode - Error status code in case of failure
 */
export type TchefResult<T> =
    | { ok: true; data: T;  }
    | { ok: false; error: string; statusCode: number };
