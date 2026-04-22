type HTTPVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

type ResponseFormat = 'json' | 'text' | 'blob';

interface StandardSchemaIssue {
    readonly message: string;
    readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[];
}

type StandardSchemaResult<Output> =
    | { readonly value: Output; readonly issues?: undefined }
    | { readonly issues: readonly StandardSchemaIssue[] };

interface StandardSchemaV1<Input = unknown, Output = Input> {
    readonly '~standard': {
        readonly version: 1;
        readonly vendor: string;
        readonly validate: (
            value: unknown,
        ) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
        readonly types?: { readonly input: Input; readonly output: Output };
    };
}

type InferOutput<S extends StandardSchemaV1> = NonNullable<S['~standard']['types']>['output'];

/**
 * Options for the Tchef function
 *
 * @param method - HTTP method to use (default: 'GET') valid values are 'GET', 'POST', 'PUT', 'DELETE'
 * @param body - Body to send in the request. Accepts a string or FormData for multipart/form-data requests. Ignored on GET requests.
 * @param headers - Headers to send in the request
 * @param responseFormat - Format of the response (default: 'json') valid values are 'json', 'text', 'blob'
 * @param cacheType - Cache type header to use (default: 'no-cache') valid values are 'no-cache', 'private', 'public'
 * @param cacheMaxAge - Cache max age in seconds
 * @param searchParams - Search params object to add to the URL
 * @param timeoutSecs - Timeout in seconds (default: 'no-limit') valid values are 'no-limit' or a number bigger than 0
 * @param signal - Abort signal to cancel the request
 * @param retries - Number of retries to do in case of failure (default: 0)
 * @param retryDelayMs - Delay in milliseconds between retries (default: 100), can be 'exponential' to increase the delay exponentially with each retry starting from 1 second
 * @param validateSchema - Standard Schema–compliant schema (valibot, zod, arktype, etc.) used to validate the response data
 * @param retryOnValidationFail - If true, a schema validation failure triggers the retry loop (when `retries > 0`). Defaults to `false`, since validation failures are usually deterministic.
 */
interface TchefOptions<S extends StandardSchemaV1 | undefined = undefined> {
    method?: HTTPVerb;
    body?: string | FormData;
    headers?: Record<string, string>;
    responseFormat?: ResponseFormat;
    cacheType?: 'no-cache' | 'private' | 'public';
    cacheMaxAge?: number;
    searchParams?: Record<string, string | number>;
    timeoutSecs?: 'no-limit' | number;
    signal?: AbortSignal;
    retries?: number;
    retryDelayMs?: number | 'exponential';
    validateSchema?: S;
    retryOnValidationFail?: boolean;
}

/**
 * Result of the Tchef function
 *
 * Depending on the success of the request, the result will have either the 'data' or 'error' property,
 * and the 'ok' property will be true or false respectively.
 *
 * @param ok - True if the request was successful, false otherwise
 * @param data - Data returned by the request
 * @param error - Error message in case of failure
 * @param statusCode - Error status code in case of failure
 */
type TchefResult<T> = { ok: true; data: T } | { ok: false; error: string; statusCode: number };

export type {
    HTTPVerb,
    InferOutput,
    ResponseFormat,
    StandardSchemaIssue,
    StandardSchemaV1,
    TchefOptions,
    TchefResult,
};
