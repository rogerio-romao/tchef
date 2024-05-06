import { expect, test } from 'vitest';
import type { TchefOptions } from '../types';
import deepMergeHeaders from '../utils/deepMergeHeaders.ts';

test('deepMergeHeaders', () => {
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

    const result = deepMergeHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        'Content-type': 'application/json; charset=UTF-8',
        Authorization: 'Bearer token',
        'x-test': 'bar',
    });
});

test('sets the right Content-type for text', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    };

    const options: TchefOptions = {
        responseFormat: 'text',
    };

    const result = deepMergeHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        'Content-type': 'text/plain; charset=UTF-8',
    });
});

test('sets the right Content-type for blob', () => {
    const defaultOptions: TchefOptions = {
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    };

    const options: TchefOptions = {
        responseFormat: 'blob',
    };

    const result = deepMergeHeaders(defaultOptions, options);

    expect(result).toStrictEqual({
        'Content-type': 'application/octet-stream',
    });
});
