// packages
import { consola } from 'consola';

// types
import type { TchefOptions } from './types';

const defaultOptions: TchefOptions = {
    method: 'GET',
    headers: {
        'Content-type': 'application/json; charset=UTF-8',
    },
};

export default async function tchef(
    url: string,
    options: TchefOptions = {}
): Promise<unknown> {
    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
        });

        if (!response.ok) {
            return { error: response.statusText };
        }

        const data = await response.json();
        consola.info(data);

        return data;
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'Unknown Error' };
    }
}
