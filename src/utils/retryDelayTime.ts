/* eslint-disable no-mixed-operators */
// types
import type { TchefOptions } from '@/types';

/**
 * Calculates the delay time before the next retry attempt based on the provided options and current retry count.
 * Supports both fixed and exponential backoff strategies.
 *
 * @param { TchefOptions } defaultOptions - The default options that may contain retry delay settings.
 * @param { number } currentRetries - The current number of retry attempts that have been made.
 * @param { TchefOptions } [options] - The specific options for the current request that may override default retry delay settings.
 * @returns { number } The calculated delay time in milliseconds before the next retry attempt.
 */
export default function retryDelayTime(
    defaultOptions: TchefOptions,
    currentRetries: number,
    options: TchefOptions = {},
): number {
    const hasRetryDelay =
        (typeof options.retryDelayMs === 'number' && options.retryDelayMs > 0) ||
        options.retryDelayMs === 'exponential';

    if (!hasRetryDelay) {
        const defaultDelayType =
            defaultOptions.retryDelayMs === 'exponential' ? 'exponential' : 'fixed';

        if (defaultDelayType === 'fixed') {
            // should be a number already, making TS happy
            return Number(defaultOptions.retryDelayMs);
        }

        // Exponential delay
        return 1000 * 2 ** (currentRetries + 1);
    }

    const optionsDelayType = options.retryDelayMs === 'exponential' ? 'exponential' : 'fixed';

    if (optionsDelayType === 'fixed') {
        // should be a number already, just making TS happy
        return Number(options.retryDelayMs);
    }

    // Exponential delay
    return 2000 * 2 ** (currentRetries + 1);
}
