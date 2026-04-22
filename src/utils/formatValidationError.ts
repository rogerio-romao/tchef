interface Issue {
    readonly message: string;
    readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[];
}

/**
 * Formats an array of validation issues into a human-readable string.
 * Shows the first 3 issues and indicates if there are more.
 *
 * @param { readonly Issue[] } issues - An array of validation issues to format.
 * @returns { string } A formatted string summarizing the validation errors.
 */
export default function formatValidationError(issues: readonly Issue[]): string {
    const first3 = issues.slice(0, 3);
    const formatted = first3.map((issue) => {
        if (issue.path && issue.path.length > 0) {
            const pathStr = issue.path
                .map((seg) => (typeof seg === 'object' && 'key' in seg ? seg.key : seg))
                .join('.');
            return `${pathStr}: ${issue.message}`;
        }
        return issue.message;
    });

    const base = `Validation failed: ${formatted.join('; ')}`;
    return issues.length > 3 ? `${base} (+${issues.length - 3} more)` : base;
}
