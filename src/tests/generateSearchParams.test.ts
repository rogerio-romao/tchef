import { expect, test } from 'vitest';
import type { TchefOptions } from '../types';
import generateSearchParams from '../utils/generateSearchParams.ts';

test('generates search params', () => {
    const url = new URL('https://example.com');
    const options: TchefOptions = {
        searchParams: { foo: 'bar', baz: 'qux' },
    };

    const result = generateSearchParams(url, options);

    expect(result.searchParams.get('foo')).toBe('bar');
    expect(result.searchParams.get('baz')).toBe('qux');
});

test('does not override existing search params', () => {
    const url = new URL('https://example.com?foo=bar');
    const options: TchefOptions = {
        searchParams: { foo: 'baz' },
    };

    const result = generateSearchParams(url, options);

    expect(result.searchParams.get('foo')).toBe('bar');
});

test('does not add search params if none are provided', () => {
    const url = new URL('https://example.com');
    const options: TchefOptions = {};

    const result = generateSearchParams(url, options);

    expect(result.searchParams.size).toBe(0);
});

test('does not add search params if empty array is provided', () => {
    const url = new URL('https://example.com');
    const options: TchefOptions = {
        searchParams: {},
    };

    const result = generateSearchParams(url, options);

    expect(result.searchParams.size).toBe(0);
});

test('maintains existing search params', () => {
    const url = new URL('https://example.com?foo=bar');
    const options: TchefOptions = {};

    const result = generateSearchParams(url, options);

    expect(result.search).toBe('?foo=bar');
});
