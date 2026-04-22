// types
import type { TchefOptions } from '@/types';

/**
 * Normalizes a header key to standard HTTP header capitalization.
 * E.g., "content-type" becomes "Content-Type".
 *
 * @param { string } key - The header key to normalize.
 * @returns { string } The normalized header key.
 */
function normalizeHeaderKey(key: string): string {
    return key
        .split('-')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
        .join('-');
}

/**
 * Normalizes the keys of a headers object to standard HTTP header capitalization.
 *
 * @param { Record<string, string> | undefined } headers - The headers to normalize.
 * @returns { Record<string, string> | undefined } A new headers object with normalized keys, or undefined if input is undefined.
 */
function normalizeHeaders(
    headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
    if (headers === undefined) {
        return undefined;
    }
    return Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [normalizeHeaderKey(key), value]),
    );
}

/**
 * Generates the final headers for a request by merging source and target options,
 * applying conditional logic based on HTTP method, body type, and response format.
 *
 * @param { TchefOptions } src - The source options providing default headers.
 * @param { TchefOptions } target - The target options that may override source headers and add new ones.
 * @returns { Record<string, string> } The final headers object to be used in the request.
 */
// oxlint-disable-next-line max-statements
export default function generateHeaders(
    src: TchefOptions,
    target: TchefOptions,
): Record<string, string> {
    const conditionalHeaders: Record<string, string> = {};

    const normalizedSrcHeaders = normalizeHeaders(src.headers);
    const normalizedTargetHeaders = normalizeHeaders(target.headers);

    const cacheOptions = {
        cacheMaxAge: target.cacheMaxAge ?? src.cacheMaxAge,
        cacheType: target.cacheType ?? src.cacheType,
    };

    if (cacheOptions.cacheType) {
        conditionalHeaders['Cache-Control'] =
            `${cacheOptions.cacheType}, max-age=${cacheOptions.cacheMaxAge}`;
    }

    if (target.method && target.method !== 'GET') {
        if (target.body instanceof FormData) {
            // Let fetch set Content-Type with the correct multipart boundary automatically.
            // Strip any user-provided Content-Type to prevent a boundary-less header breaking the request.
            if (normalizedTargetHeaders) {
                delete normalizedTargetHeaders['Content-Type'];
            }
        } else if (
            normalizedTargetHeaders?.['Content-Type'] === undefined &&
            normalizedSrcHeaders?.['Content-Type'] === undefined
        ) {
            switch (target.responseFormat) {
                case 'text': {
                    conditionalHeaders['Content-Type'] = 'text/plain; charset=UTF-8';
                    break;
                }
                case 'blob': {
                    conditionalHeaders['Content-Type'] = 'application/octet-stream';
                    break;
                }
                default: {
                    conditionalHeaders['Content-Type'] = 'application/json; charset=UTF-8';
                    break;
                }
            }
        }
    } else if (normalizedTargetHeaders?.Accept === undefined) {
        switch (target.responseFormat) {
            case 'text': {
                conditionalHeaders.Accept = 'text/*';
                break;
            }
            case 'blob': {
                conditionalHeaders.Accept = '*/*';
                break;
            }
            default: {
                conditionalHeaders.Accept = 'application/json';
                break;
            }
        }
    }

    const headersObj = {
        ...normalizedSrcHeaders,
        ...normalizedTargetHeaders,
        ...conditionalHeaders,
    };

    return headersObj;
}
