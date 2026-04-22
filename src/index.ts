// oxlint-disable max-lines

// utils
import formatValidationError from './utils/formatValidationError.ts';
import generateHeaders from './utils/generateHeaders.ts';
import generateSearchParams from './utils/generateSearchParams.ts';
import retryDelayTime from './utils/retryDelayTime.ts';
import sleep from './utils/sleep.ts';

// types
import type { InferOutput, StandardSchemaV1, TchefOptions, TchefResult } from './types';

/**
 * Tchef wraps the fetch API with additional features like retries, validation, and more.
 * @param { string } url The URL to fetch, as a string. Can include search params.
 * @param { TchefOptions } options The options for the request. This includes the method, headers, response format, cache type, cache max age, timeout, retries, retry delay, and more.
 * @param { number } _currentRetries The current number of retries. This is used internally for recursive calls. Do not set this manually.
 * @param { string } _transitiveErrorMessage The error message from the previous attempt. This is used internally for recursive calls. Do not set this manually.
 * @returns { Promise<TchefResult<T>>} The result of the request. This can be a success or an error. On success, an object with the data is returned. On error, an object with the error message and statusCode code is returned.
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
// Overload: schema present — result type inferred from schema, no <T> needed at call site
export default async function tchef<S extends StandardSchemaV1>(
    url: string,
    options: TchefOptions<S> & { validateSchema: S },
    _currentRetries?: number,
    _transitiveErrorMessage?: string,
): Promise<TchefResult<InferOutput<S>>>;
// Overload: no schema — caller supplies <T> explicitly (defaults to unknown)
export default async function tchef<T = unknown>(
    url: string,
    options?: TchefOptions & { validateSchema?: undefined },
    _currentRetries?: number,
    _transitiveErrorMessage?: string,
): Promise<TchefResult<T>>;
// oxlint-disable-next-line max-lines-per-function, complexity, max-statements
export default async function tchef(
    url: string,
    options: TchefOptions = {},
    _currentRetries = 0,
    _transitiveErrorMessage = '',
): Promise<TchefResult<unknown>> {
    // Check if fetch is supported
    if (typeof globalThis.fetch !== 'function') {
        return {
            error: 'Fetch not supported on current platform, use latest versions.',
            ok: false,
            statusCode: 400,
        };
    }

    const defaultOptions: TchefOptions = {
        cacheMaxAge: 60,
        cacheType: 'private',
        method: 'GET',
        responseFormat: 'json',
        retries: 0,
        retryDelayMs: 100,
        retryOnValidationFail: false,
        timeoutSecs: 'no-limit',
    };

    // Retries
    const hasRetries = typeof options.retries === 'number' && options.retries > 0;

    // Delay between retries
    const retryWaitTime = retryDelayTime(defaultOptions, _currentRetries, options);

    // this passes the error message from the previous attempt to the next one
    let transitiveError = '';

    // Check if the request should be retried
    if (
        (hasRetries && typeof options.retries === 'number' && _currentRetries <= options.retries) ||
        _currentRetries === 0
    ) {
        // Check if the URL is valid
        const urlIsValid = URL.canParse(url);
        if (!urlIsValid) {
            return { error: 'Invalid URL', ok: false, statusCode: 400 };
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

        // Strip body for GET requests — HTTP spec does not allow bodies on GET requests
        // and behaviour varies across environments
        if (mergedOptions.method === 'GET') {
            delete mergedOptions.body;
        }

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

                    return tchef(url, options, _currentRetries + 1, transitiveError);
                }

                return {
                    error: response.statusText,
                    ok: false,
                    statusCode: response.status,
                };
            }

            // Parse the response
            try {
                switch (mergedOptions.responseFormat) {
                    case 'json': {
                        if (options.validateSchema === undefined) {
                            const data = await response.json();
                            return { data, ok: true };
                        }
                        const body = await response.json();
                        const schema = options.validateSchema as StandardSchemaV1;
                        const validated = await schema['~standard'].validate(body);
                        if (validated.issues === undefined) {
                            return { data: validated.value, ok: true };
                        }
                        const errorString = formatValidationError(validated.issues);
                        if (options.retryOnValidationFail === true && hasRetries) {
                            transitiveError = `409 - ${errorString}`;
                            await sleep(retryWaitTime);
                            return tchef(url, options, _currentRetries + 1, transitiveError);
                        }
                        return { error: errorString, ok: false, statusCode: 409 };
                    }
                    case 'text': {
                        const text = await response.text();
                        return { data: text, ok: true };
                    }
                    case 'blob': {
                        const blob = await response.blob();
                        return { data: blob, ok: true };
                    }
                    default: {
                        return {
                            error: 'Invalid response format',
                            ok: false,
                            statusCode: 409,
                        };
                    }
                }
            } catch {
                // Handle parsing errors
                switch (mergedOptions.responseFormat) {
                    case 'json': {
                        if (hasRetries) {
                            // store the error message
                            transitiveError = '422 - Invalid JSON';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(url, options, _currentRetries + 1, transitiveError);
                        }

                        return {
                            error: 'Invalid JSON',
                            ok: false,
                            statusCode: 422,
                        };
                    }

                    case 'text': {
                        if (hasRetries) {
                            // store the error message
                            transitiveError = '422 - Invalid text';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(url, options, _currentRetries + 1, transitiveError);
                        }

                        return {
                            error: 'Invalid text',
                            ok: false,
                            statusCode: 422,
                        };
                    }

                    case 'blob': {
                        if (hasRetries) {
                            // store the error message
                            transitiveError = '422 - Invalid blob';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(url, options, _currentRetries + 1, transitiveError);
                        }

                        return {
                            error: 'Invalid blob',
                            ok: false,
                            statusCode: 422,
                        };
                    }

                    default: {
                        if (hasRetries) {
                            // store the error message
                            transitiveError = '422 - Invalid response format';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(url, options, _currentRetries + 1, transitiveError);
                        }

                        return {
                            error: 'Invalid response format',
                            ok: false,
                            statusCode: 422,
                        };
                    }
                }
            }
        } catch (error) {
            // Handle abort errors
            if (error instanceof DOMException && error.name === 'AbortError') {
                return {
                    error: `Request aborted${hasRetries ? ', retries cancelled' : ''}`,
                    ok: false,
                    statusCode: 499,
                };
            }
            if (error instanceof DOMException && error.name === 'TimeoutError') {
                if (hasRetries) {
                    // store the error message
                    transitiveError = '408 - Request timeout';

                    // Retry the request
                    await sleep(retryWaitTime);

                    return tchef(url, options, _currentRetries + 1, transitiveError);
                }

                return { error: 'Request timeout', ok: false, statusCode: 408 };
            }
            // Handle network errors
            if (error instanceof Error) {
                if (hasRetries) {
                    // store the error message
                    transitiveError = `500 - ${error.message}`;

                    // Retry the request
                    await sleep(retryWaitTime);

                    return tchef(url, options, _currentRetries + 1, transitiveError);
                }

                return { error: error.message, ok: false, statusCode: 500 };
            }

            if (hasRetries) {
                // store the error message
                transitiveError = '500 - Network Error';

                // Retry the request
                await sleep(retryWaitTime);

                return tchef(url, options, _currentRetries + 1, transitiveError);
            }

            return { error: 'Network Error', ok: false, statusCode: 500 };
        }
    } else {
        // Max retries reached
        const [status, errorMessage] = _transitiveErrorMessage.split(' - ');

        return {
            error: `Max retries reached. ${errorMessage}`,
            ok: false,
            statusCode: Number(status),
        };
    }
}

export {
    type InferOutput,
    type StandardSchemaV1,
    type TchefOptions,
    type TchefResult,
} from './types.ts';
