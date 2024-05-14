import { expect, test } from 'vitest';
import type { TchefOptions } from '../types';
import retryDelayTime from '../utils/retryDelayTime.ts';

test('retryDelayTime default', () => {
    const defaultOptions: TchefOptions = {
        retryDelayMs: 100,
    };

    const currentRetries = 0;
    const result = retryDelayTime(defaultOptions, currentRetries);
    expect(result).toBe(100);
});

test('options override default', () => {
    const defaultOptions: TchefOptions = {
        retryDelayMs: 100,
    };

    const currentRetries = 0;
    const options: TchefOptions = {
        retryDelayMs: 200,
    };

    const result = retryDelayTime(defaultOptions, currentRetries, options);
    expect(result).toBe(200);
});

test('retryDelayTime exponential 1', () => {
    const defaultOptions: TchefOptions = {
        retryDelayMs: 'exponential',
    };

    const currentRetries = 0;
    const result = retryDelayTime(defaultOptions, currentRetries);
    expect(result).toBe(2000);
});

test('retryDelayTime exponential 2', () => {
    const defaultOptions: TchefOptions = {
        retryDelayMs: 'exponential',
    };

    const currentRetries = 1;
    const result = retryDelayTime(defaultOptions, currentRetries);
    expect(result).toBe(4000);
});

test('retryDelayTime exponential 3', () => {
    const defaultOptions: TchefOptions = {
        retryDelayMs: 'exponential',
    };

    const currentRetries = 2;
    const result = retryDelayTime(defaultOptions, currentRetries);
    expect(result).toBe(8000);
});

test('retryDelayTime exponential 4', () => {
    const defaultOptions: TchefOptions = {
        retryDelayMs: 'exponential',
    };

    const currentRetries = 3;
    const result = retryDelayTime(defaultOptions, currentRetries);
    expect(result).toBe(16000);
});
