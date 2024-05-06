// packages
import { consola } from 'consola';

// utils
import deepMergeHeaders from './utils/deepMergeHeaders.ts';

// types
import type { TchefOptions, TchefResult } from './types';

const defaultOptions: TchefOptions = {
    method: 'GET',
    headers: {
        'Content-type': 'application/json; charset=UTF-8',
    },
    responseFormat: 'json',
};

export default async function tchef(
    url: string,
    options: TchefOptions = {}
): Promise<TchefResult> {
    const headers = deepMergeHeaders(defaultOptions, options);

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers,
    };

    consola.info('mergedOptions:', mergedOptions);

    try {
        const response = await fetch(url, {
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
