import { expect, test } from 'vitest';
import type { TchefOptions } from '../types.ts';
import generateHeaders from '../utils/generateHeaders.ts';

test('generateHeaders', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            'x-test': 'foo',
        },
    };

    const options: TchefOptions = {
        headers: {
            Authorization: 'Bearer token',
            'x-test': 'bar',
        },
    };

    const result = generateHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        'Content-type': 'application/json; charset=UTF-8',
        Authorization: 'Bearer token',
        'x-test': 'bar',
    });
});

test('sets the right Accept header for text', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            Accept: 'application/json',
        },
    };

    const options: TchefOptions = {
        responseFormat: 'text',
    };

    const result = generateHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        'Content-type': 'application/json; charset=UTF-8',
        Accept: 'text/*',
    });
});

test('sets the right Accept header for blob', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
            Accept: 'application/json',
        },
    };

    const options: TchefOptions = {
        responseFormat: 'blob',
    };

    const result = generateHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        'Content-type': 'application/json; charset=UTF-8',
        Accept: '*/*',
    });
});

test('sets the right Content-type header for text', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            Accept: 'application/json',
        },
    };

    const options: TchefOptions = {
        method: 'POST',
        responseFormat: 'text',
    };

    const result = generateHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        Accept: 'application/json',
        'Content-type': 'text/plain; charset=UTF-8',
    });
});

test('sets the right Content-type header for blob', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            Accept: 'application/json',
        },
    };

    const options: TchefOptions = {
        method: 'POST',
        responseFormat: 'blob',
    };

    const result = generateHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        Accept: 'application/json',
        'Content-type': 'application/octet-stream',
    });
});

test('sets the right Cache-Control header for no-cache', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            Accept: 'application/json',
        },
    };

    const options: TchefOptions = {
        cacheType: 'no-cache',
        cacheMaxAge: 0,
    };

    const result = generateHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        Accept: 'application/json',
        'Cache-Control': 'no-cache, max-age=0',
    });
});

test('sets the right Cache-Control header for private', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            Accept: 'application/json',
        },
    };

    const options: TchefOptions = {
        cacheType: 'private',
        cacheMaxAge: 60,
    };

    const result = generateHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        Accept: 'application/json',
        'Cache-Control': 'private, max-age=60',
    });
});

test('sets the right Cache-Control header for public', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            Accept: 'application/json',
        },
        cacheType: 'private',
        cacheMaxAge: 100,
    };

    const options: TchefOptions = {
        cacheType: 'public',
        cacheMaxAge: 60,
    };

    const result = generateHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        Accept: 'application/json',
        'Cache-Control': 'public, max-age=60',
    });
});
