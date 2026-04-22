/**
 * Utility function to create a delay for a specified amount of time.
 *
 * @param { number } ms - The number of milliseconds to sleep.
 * @returns { Promise<void> } A promise that resolves after the specified delay.
 */
export default function sleep(ms: number): Promise<void> {
    // oxlint-disable-next-line promise/avoid-new
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
