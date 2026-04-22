// types
import type { TchefOptions } from '@/types';

/**
 * Generates a URL with search parameters based on the provided options.
 * If the URL already has search parameters, it will not override them with options.
 *
 * @param { URL } url - The base URL to which search parameters will be added.
 * @param { TchefOptions } options - The options containing potential search parameters.
 * @returns { URL } The URL with the appropriate search parameters added.
 */
export default function generateSearchParams(url: URL, options: TchefOptions): URL {
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
