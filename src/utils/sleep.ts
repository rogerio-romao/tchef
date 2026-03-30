export default function sleep(ms: number): Promise<void> {
    // oxlint-disable-next-line promise/avoid-new
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
