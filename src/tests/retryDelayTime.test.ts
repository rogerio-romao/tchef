import retryDelayTime from '@/utils/retryDelayTime.ts';

import type { TchefOptions } from '@/types';

describe('retries tests', () => {
    it('retryDelayTime default', () => {
        const defaultOptions: TchefOptions = {
            retryDelayMs: 100,
        };

        const currentRetries = 0;
        const result = retryDelayTime(defaultOptions, currentRetries);
        expect(result).toBe(100);
    });

    it('options override default', () => {
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

    it('retryDelayTime exponential 1', () => {
        const defaultOptions: TchefOptions = {
            retryDelayMs: 'exponential',
        };

        const currentRetries = 0;
        const result = retryDelayTime(defaultOptions, currentRetries);
        expect(result).toBe(2000);
    });

    it('retryDelayTime exponential 2', () => {
        const defaultOptions: TchefOptions = {
            retryDelayMs: 'exponential',
        };

        const currentRetries = 1;
        const result = retryDelayTime(defaultOptions, currentRetries);
        expect(result).toBe(4000);
    });

    it('retryDelayTime exponential 3', () => {
        const defaultOptions: TchefOptions = {
            retryDelayMs: 'exponential',
        };

        const currentRetries = 2;
        const result = retryDelayTime(defaultOptions, currentRetries);
        expect(result).toBe(8000);
    });

    it('retryDelayTime exponential 4', () => {
        const defaultOptions: TchefOptions = {
            retryDelayMs: 'exponential',
        };

        const currentRetries = 3;
        const result = retryDelayTime(defaultOptions, currentRetries);
        expect(result).toBe(16_000);
    });
});
