// packages
import { safeParse } from 'valibot';

// utils
import generateHeaders from './utils/generateHeaders.ts';
import generateSearchParams from './utils/generateSearchParams.ts';
import retryDelayTime from './utils/retryDelayTime.ts';
import sleep from './utils/sleep.ts';

// types
import type { TchefOptions, TchefResult } from './types';

/**
 * tchef wraps the fetch API with additional features like retries, validation, and more.
 *
 * @param url The URL to fetch, as a string. Can include search params.
 * @param options The options for the request. This includes the method, headers, response format, cache type, cache max age, timeout, retries, retry delay, and more.
 * @param currentRetries The current number of retries. This is used internally for recursive calls. Do not set this manually.
 * @param transitiveErrorMessage The error message from the previous attempt. This is used internally for recursive calls. Do not set this manually.
 * @returns The result of the request. This can be a success or an error. On success, an object with the data is returned. On error, an object with the error message and statusCode code is returned.
 *
 * @example
 * ```ts
 * // basic usage
 * const result = await tchef('https://jsonplaceholder.typicode.com/todos/1');
 * console.log(result);
 * ```
 *
 * @example
 * ```ts
 * // with timeout
 * const result = await tchef('https://httpbin.org/delay/2', { timeoutSecs: 1 });
 * // that url will only reply after 2 seconds, so this will return:
 * { ok: false, error: 'Request timeout', statusCode: 408 }
 * ```
 *
 * @example
 * ```ts
 * // with retries
 * const result = await tchef('https://thisisfake.url', { retries: 2 });
 * // that url does not exist, so this will return:
 * { ok: false, error: 'Max retries reached. Not Found', statusCode: 404 }
 * ```
 *
 * @example
 * ```ts
 * // with generic type
 * const result = await tchef<{ userId: number }>('https://jsonplaceholder.typicode.com/todos/1');
 * console.log(result.data.userId);
 * ```
 */
export default async function tchef<T = unknown>(
    url: string,
    options: TchefOptions = {},
    currentRetries = 0,
    transitiveErrorMessage = ''
): Promise<TchefResult<T>> {
    // Check if fetch is supported
    if (typeof globalThis.fetch !== 'function') {
        return {
            ok: false,
            error: 'Fetch not supported on current platform, use latest versions.',
            statusCode: 400,
        };
    }

    const defaultOptions: TchefOptions = {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
        responseFormat: 'json',
        cacheType: 'private',
        cacheMaxAge: 60,
        timeoutSecs: 'no-limit',
        retries: 0,
        retryDelayMs: 100,
    };

    // Retries
    const hasRetries =
        typeof options.retries === 'number' && options.retries > 0;

    // Delay between retries
    const retryWaitTime = retryDelayTime(
        defaultOptions,
        currentRetries,
        options
    );

    // this passes the error message from the previous attempt to the next one
    let transitiveError = '';

    // Check if the request should be retried
    if (
        (hasRetries &&
            typeof options.retries === 'number' &&
            currentRetries <= options.retries) ||
        currentRetries === 0
    ) {
        // Check if the URL is valid
        const urlIsValid = URL.canParse(url);
        if (!urlIsValid) {
            return { ok: false, error: 'Invalid URL', statusCode: 400 };
        }

        // Generate the URL with search params
        const validUrl = new URL(url);
        const urlWithParams = generateSearchParams(validUrl, options);

        // Generate the headers
        const headers = generateHeaders(defaultOptions, options);

        // Merge the default options with the user options and the headers
        const mergedOptions: TchefOptions = {
            ...defaultOptions,
            ...options,
            headers,
            ...(typeof options.timeoutSecs === 'number' &&
                options.timeoutSecs > 0 && {
                    signal: AbortSignal.timeout(options.timeoutSecs * 1000),
                }),
        };

        // Make the request
        try {
            const response = await fetch(urlWithParams, {
                ...mergedOptions,
            });

            if (!response.ok) {
                if (hasRetries) {
                    // store the error message
                    transitiveError = `${response.status} - ${response.statusText}`;

                    // Retry the request
                    await sleep(retryWaitTime);

                    return tchef(
                        url,
                        options,
                        currentRetries + 1,
                        transitiveError
                    );
                }

                return {
                    ok: false,
                    error: response.statusText,
                    statusCode: response.status,
                };
            }

            // Parse the response
            try {
                switch (mergedOptions.responseFormat) {
                    case 'json':
                        if (options.validateSchema !== undefined) {
                            const result = safeParse(
                                options.validateSchema,
                                await response.json()
                            );
                            return !result.success
                                ? {
                                      ok: false,
                                      error: 'Response failed to validate against schema.',
                                      statusCode: 409,
                                  }
                                : {
                                      ok: true,
                                      data: result.output as T,
                                  };
                        }
                        const data = (await response.json()) as T;
                        return { ok: true, data };
                    case 'text':
                        const text = await response.text();
                        return { ok: true, data: text as unknown as T };
                    case 'blob':
                        const blob = await response.blob();
                        return { ok: true, data: blob as unknown as T };
                    default:
                        return {
                            ok: false,
                            error: 'Invalid response format',
                            statusCode: 409,
                        };
                }
            } catch (error) {
                // Handle parsing errors
                switch (mergedOptions.responseFormat) {
                    case 'json':
                        if (hasRetries) {
                            // store the error message
                            transitiveError = '422 - Invalid JSON';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(
                                url,
                                options,
                                currentRetries + 1,
                                transitiveError
                            );
                        }

                        return {
                            ok: false,
                            error: 'Invalid JSON',
                            statusCode: 422,
                        };

                    case 'text':
                        if (hasRetries) {
                            // store the error message
                            transitiveError = '422 - Invalid text';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(
                                url,
                                options,
                                currentRetries + 1,
                                transitiveError
                            );
                        }

                        return {
                            ok: false,
                            error: 'Invalid text',
                            statusCode: 422,
                        };

                    case 'blob':
                        if (hasRetries) {
                            // store the error message
                            transitiveError = '422 - Invalid blob';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(
                                url,
                                options,
                                currentRetries + 1,
                                transitiveError
                            );
                        }

                        return {
                            ok: false,
                            error: 'Invalid blob',
                            statusCode: 422,
                        };

                    default:
                        if (hasRetries) {
                            // store the error message
                            transitiveError = '422 - Invalid response format';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(
                                url,
                                options,
                                currentRetries + 1,
                                transitiveError
                            );
                        }

                        return {
                            ok: false,
                            error: 'Invalid response format',
                            statusCode: 422,
                        };
                }
            }
        } catch (error) {
            // Handle abort errors
            if (error instanceof DOMException && error.name === 'AbortError') {
                return {
                    ok: false,
                    error: `Request aborted${
                        hasRetries ? ', retries cancelled' : ''
                    }`,
                    statusCode: 499,
                };
            }
            if (
                error instanceof DOMException &&
                error.name === 'TimeoutError'
            ) {
                if (hasRetries) {
                    // store the error message
                    transitiveError = '408 - Request timeout';

                    // Retry the request
                    await sleep(retryWaitTime);

                    return tchef(
                        url,
                        options,
                        currentRetries + 1,
                        transitiveError
                    );
                }

                return { ok: false, error: 'Request timeout', statusCode: 408 };
            }
            // Handle network errors
            if (error instanceof Error) {
                if (hasRetries) {
                    // store the error message
                    transitiveError = `500 - ${error.message}`;

                    // Retry the request
                    await sleep(retryWaitTime);

                    return tchef(
                        url,
                        options,
                        currentRetries + 1,
                        transitiveError
                    );
                }

                return { ok: false, error: error.message, statusCode: 500 };
            }

            if (hasRetries) {
                // store the error message
                transitiveError = '500 - Network Error';

                // Retry the request
                await sleep(retryWaitTime);

                return tchef(url, options, currentRetries + 1, transitiveError);
            }

            return { ok: false, error: 'Network Error', statusCode: 500 };
        }
    } else {
        // Max retries reached
        const [status, errorMessage] = transitiveErrorMessage.split(' - ');

        return {
            ok: false,
            error: `Max retries reached. ${errorMessage}`,
            statusCode: Number(status),
        };
    }
}

export { type TchefOptions, type TchefResult } from './types.ts';
