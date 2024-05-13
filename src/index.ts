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
};

export default async function tchef(
    url: string,
    options: TchefOptions = {}
): Promise<TchefResult> {
    const urlIsValid = URL.canParse(url);
    if (!urlIsValid) {
        return { ok: false, error: 'Invalid URL' };
    }

    const validUrl = new URL(url);
    const urlWithParams = generateSearchParams(validUrl, options);

    const headers = generateHeaders(defaultOptions, options);

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers,
    };

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
        if (error instanceof Error) {
            return { ok: false, error: error.message };
        }
        return { ok: false, error: 'Network Error' };
    }
}
