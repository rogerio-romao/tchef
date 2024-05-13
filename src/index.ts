// utils
import generateHeaders from './utils/generateHeaders.ts';
import generateSearchParams from './utils/generateSearchParams.ts';

// types
import type { TchefOptions, TchefResult } from './types';

const defaultOptions: TchefOptions = {
    method: 'GET',
    headers: {
        Accept: 'application/json',
    },
    responseFormat: 'json',
    cacheType: 'private',
    cacheMaxAge: 60,
    timeout: 'no-limit',
};

export default async function tchef(
    url: string,
    options: TchefOptions = {}
): Promise<TchefResult> {
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
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers,
        ...(typeof options.timeout === 'number' && {
            signal: AbortSignal.timeout(options.timeout * 1000),
        }),
    };

    // Make the request
    try {
        const response = await fetch(urlWithParams, {
            ...mergedOptions,
        });

        if (!response.ok) {
            return {
                ok: false,
                error: `${response.status} - ${response.statusText}`,
            };
        }

        // Parse the response
        try {
            switch (mergedOptions.responseFormat) {
                case 'json':
                    const data = await response.json();
                    return { ok: true, data };
                case 'text':
                    const text = await response.text();
                    return { ok: true, data: text };
                case 'blob':
                    const blob = await response.blob();
                    return { ok: true, data: blob };
                default:
                    return { ok: false, error: 'Invalid response format' };
            }
        } catch (error) {
            // Handle parsing errors
            switch (mergedOptions.responseFormat) {
                case 'json':
                    return { ok: false, error: 'Invalid JSON' };
                case 'text':
                    return { ok: false, error: 'Invalid text' };
                case 'blob':
                    return { ok: false, error: 'Invalid blob' };
                default:
                    return { ok: false, error: 'Invalid response format' };
            }
        }
    } catch (error) {
        // Handle abort errors
        if (error instanceof DOMException && error.name === 'AbortError') {
            return { ok: false, error: 'Request aborted' };
        }
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            return { ok: false, error: 'Request timeout' };
        }
        // Handle network errors
        if (error instanceof Error) {
            return { ok: false, error: error.message };
        }
        return { ok: false, error: 'Network Error' };
    }
}
