// types
import type { TchefOptions } from '../types';

export default function deepMergeHeaders(
    src: TchefOptions,
    target: TchefOptions
): Record<string, string> {
    const conditionalHeaders: Record<string, string> = {};
    if (target.responseFormat && target.responseFormat === 'text') {
        conditionalHeaders['Content-type'] = 'text/plain; charset=UTF-8';
    }
    if (target.responseFormat && target.responseFormat === 'blob') {
        conditionalHeaders['Content-type'] = 'application/octet-stream';
    }
    const headers = {
        ...src.headers,
        ...target.headers,
        ...conditionalHeaders,
    };

    return headers;
}
