// packages
import { consola } from 'consola';

// types
import type { TchefOptions, TchefResult } from './types';

const defaultOptions: TchefOptions = {
    method: 'GET',
    headers: {
        'Content-type': 'application/json; charset=UTF-8',
    },
};

export default async function tchef(
    url: string,
    options: TchefOptions = {}
): Promise<TchefResult> {
    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
        });

        if (!response.ok) {
            return {
                ok: false,
                error: `${response.status} - ${response.statusText}`,
            };
        }

        const data = await response.json();
        consola.info(data);

        return { ok: true, data };
    } catch (error) {
        if (error instanceof Error) {
            return { ok: false, error: error.message };
        }
        return { ok: false, error: 'Network Error' };
    }
}
