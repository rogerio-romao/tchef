// types
import type { TchefOptions } from '../types';

export default function generateSearchParams(
    url: URL,
    options: TchefOptions
): URL {
    const urlHasSearchParams = url.searchParams.size > 0;

    if (!options.searchParams) {
        return url;
    }

    for (const [key, value] of Object.entries(options.searchParams)) {
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
