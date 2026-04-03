import generateSearchParams from '@/utils/generateSearchParams.ts';

import type { TchefOptions } from '@/types';

describe('generate search params helper function', () => {
    it('generates search params', () => {
        const url = new URL('https://example.com');
        const options: TchefOptions = {
            searchParams: { baz: 'qux', foo: 'bar' },
        };

        const result = generateSearchParams(url, options);

        expect(result.searchParams.get('foo')).toBe('bar');
        expect(result.searchParams.get('baz')).toBe('qux');
    });

    it('does not override existing search params', () => {
        const url = new URL('https://example.com?foo=bar');
        const options: TchefOptions = {
            searchParams: { foo: 'baz' },
        };

        const result = generateSearchParams(url, options);

        expect(result.searchParams.get('foo')).toBe('bar');
    });

    it('does not add search params if none are provided', () => {
        const url = new URL('https://example.com');
        const options: TchefOptions = {};

        const result = generateSearchParams(url, options);

        expect(result.searchParams.size).toBe(0);
    });

    it('does not add search params if empty array is provided', () => {
        const url = new URL('https://example.com');
        const options: TchefOptions = {
            searchParams: {},
        };

        const result = generateSearchParams(url, options);

        expect(result.searchParams.size).toBe(0);
    });

    it('maintains existing search params', () => {
        const url = new URL('https://example.com?foo=bar');
        const options: TchefOptions = {};

        const result = generateSearchParams(url, options);

        expect(result.search).toBe('?foo=bar');
    });
});
