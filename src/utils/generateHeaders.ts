// types
import type { TchefOptions } from '@/types';

function normalizeHeaderKey(key: string): string {
    return key
        .split('-')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
        .join('-');
}

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
        if (
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
