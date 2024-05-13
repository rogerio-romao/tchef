export type TchefResponse = {
    error?: string;
};

export type HTTPVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type ResponseFormat = 'json' | 'text' | 'blob';

export type TchefOptions = {
    method?: HTTPVerb;
    body?: string;
    headers?: Record<string, string>;
    responseFormat?: ResponseFormat;
    cacheType?: 'no-cache' | 'private' | 'public';
    cacheMaxAge?: number;
    searchParams?: Array<Record<string, string | number>>;
    timeout?: 'no-limit' | number;
    signal?: AbortSignal;
};

export type TchefResult =
    | { data: unknown; ok: true }
    | { error: string; ok: false };
