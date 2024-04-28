// packages
import { consola } from 'consola';

// types
import type { TchefOptions, TchefResponse } from './types';

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
}
