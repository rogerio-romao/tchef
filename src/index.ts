// packages
import { safeParse } from 'valibot';

// utils
import generateHeaders from './utils/generateHeaders.ts';
import generateSearchParams from './utils/generateSearchParams.ts';
import retryDelayTime from './utils/retryDelayTime.ts';
import sleep from './utils/sleep.ts';

// types
import type { TchefOptions, TchefResult } from './types';

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
            return { ok: false, error: 'Invalid URL' };
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
                    error: `${response.status} - ${response.statusText}`,
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
                        return { ok: false, error: 'Invalid response format' };
                }
            } catch (error) {
                // Handle parsing errors
                switch (mergedOptions.responseFormat) {
                    case 'json':
                        if (hasRetries) {
                            // store the error message
                            transitiveError = 'Invalid JSON';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(
                                url,
                                options,
                                currentRetries + 1,
                                transitiveError
                            );
                        }

                        return { ok: false, error: 'Invalid JSON' };

                    case 'text':
                        if (hasRetries) {
                            // store the error message
                            transitiveError = 'Invalid text';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(
                                url,
                                options,
                                currentRetries + 1,
                                transitiveError
                            );
                        }

                        return { ok: false, error: 'Invalid text' };

                    case 'blob':
                        if (hasRetries) {
                            // store the error message
                            transitiveError = 'Invalid blob';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(
                                url,
                                options,
                                currentRetries + 1,
                                transitiveError
                            );
                        }

                        return { ok: false, error: 'Invalid blob' };

                    default:
                        if (hasRetries) {
                            // store the error message
                            transitiveError = 'Invalid response format';

                            // Retry the request
                            await sleep(retryWaitTime);

                            return tchef(
                                url,
                                options,
                                currentRetries + 1,
                                transitiveError
                            );
                        }

                        return { ok: false, error: 'Invalid response format' };
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
                };
            }
            if (
                error instanceof DOMException &&
                error.name === 'TimeoutError'
            ) {
                if (hasRetries) {
                    // store the error message
                    transitiveError = 'Request timeout';

                    // Retry the request
                    await sleep(retryWaitTime);

                    return tchef(
                        url,
                        options,
                        currentRetries + 1,
                        transitiveError
                    );
                }

                return { ok: false, error: 'Request timeout' };
            }
            // Handle network errors
            if (error instanceof Error) {
                if (hasRetries) {
                    // store the error message
                    transitiveError = error.message;

                    // Retry the request
                    await sleep(retryWaitTime);

                    return tchef(
                        url,
                        options,
                        currentRetries + 1,
                        transitiveError
                    );
                }

                return { ok: false, error: error.message };
            }

            if (hasRetries) {
                // store the error message
                transitiveError = 'Network Error';

                // Retry the request
                await sleep(retryWaitTime);

                return tchef(url, options, currentRetries + 1, transitiveError);
            }

            return { ok: false, error: 'Network Error' };
        }
    } else {
        // Max retries reached
        return {
            ok: false,
            error: `Max retries reached. ${transitiveErrorMessage}`,
        };
    }
}
