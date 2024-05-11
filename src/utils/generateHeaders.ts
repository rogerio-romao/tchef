// types
import type { TchefOptions } from '../types';

export default function generateHeaders(
    src: TchefOptions,
    target: TchefOptions
): Record<string, string> {
    const conditionalHeaders: Record<string, string> = {};

    const cacheOptions = {
        cacheType: target.cacheType ?? src.cacheType,
        cacheMaxAge: target.cacheMaxAge ?? src.cacheMaxAge,
    };

    if (cacheOptions.cacheType) {
        conditionalHeaders[
            'Cache-Control'
        ] = `${cacheOptions.cacheType}, max-age=${cacheOptions.cacheMaxAge}`;
    }

    if (target.method && target.method !== 'GET') {
        if (target.headers?.['Content-type'] == null) {
            switch (target.responseFormat) {
                case 'text':
                    conditionalHeaders['Content-type'] =
                        'text/plain; charset=UTF-8';
                    break;
                case 'blob':
                    conditionalHeaders['Content-type'] =
                        'application/octet-stream';
                    break;
                default:
                    conditionalHeaders['Content-type'] =
                        'application/json; charset=UTF-8';
                    break;
            }
        }
    } else if (target.headers?.Accept == null) {
        switch (target.responseFormat) {
            case 'text':
                conditionalHeaders.Accept = 'text/*';
                break;
            case 'blob':
                conditionalHeaders.Accept = '*/*';
                break;
            default:
                break;
        }
    }

    const headers = {
        ...src.headers,
        ...target.headers,
        ...conditionalHeaders,
    };

    return headers;
}
