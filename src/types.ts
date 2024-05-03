export type TchefResponse = {
    error?: string;
};

export type HTTPVerb = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type TchefOptions = {
    method?: HTTPVerb;
    body?: string;
    headers?: Record<string, string>;
};

export type TchefResult = { data: unknown } | { error: string };
