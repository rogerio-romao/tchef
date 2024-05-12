// types
import type { TchefOptions } from '../types';

export default function generateSearchParams(
    url: URL,
    options: TchefOptions
): URL {
    const urlHasSearchParams = url.searchParams.size > 0;

    if (!options.searchParams || options.searchParams.length === 0) {
        return url;
    }

    for (const param of options.searchParams) {
        const key = Object.keys(param)[0];
        if (key == null) {
            continue;
        }
        const value = param[key];
        if (value == null) {
            continue;
        }
        if (urlHasSearchParams) {
            const isConflict = url.searchParams.has(key);
            if (isConflict) {
                continue;
            }
        } else {
            url.searchParams.set(key, String(value));
        }
    }

    return url;
}
