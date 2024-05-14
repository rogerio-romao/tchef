/* eslint-disable no-mixed-operators */
// types
import type { TchefOptions } from '../types';

export default function retryDelayTime(
    defaultOptions: TchefOptions,
    currentRetries: number,
    options: TchefOptions = {}
): number {
    const hasRetryDelay =
        (typeof options.retryDelayMs === 'number' &&
            options.retryDelayMs > 0) ||
        options.retryDelayMs === 'exponential';

    if (!hasRetryDelay) {
        const defaultDelayType =
            defaultOptions.retryDelayMs === 'exponential'
                ? 'exponential'
                : 'fixed';

        if (defaultDelayType === 'fixed') {
            return Number(defaultOptions.retryDelayMs); // should be a number already, making TS happy
        }

        // Exponential delay
        return 1000 * 2 ** (currentRetries + 1);
    }

    const optionsDelayType =
        options.retryDelayMs === 'exponential' ? 'exponential' : 'fixed';

    if (optionsDelayType === 'fixed') {
        return Number(options.retryDelayMs); // should be a number already, making TS happy
    }

    // Exponential delay
    return 2000 * 2 ** (currentRetries + 1);
}
