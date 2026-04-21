import generateHeaders from '@/utils/generateHeaders.ts';

import type { TchefOptions } from '@/types.ts';

// oxlint-disable-next-line max-lines-per-function, max-statements
describe('generate headers helper function', () => {
    it('generateHeaders', () => {
        const defaultOptions: TchefOptions = {
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
                'x-test': 'foo',
            },
        };

        const options: TchefOptions = {
            headers: {
                Authorization: 'Bearer token',
                'x-test': 'bar',
            },
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: 'application/json',
            Authorization: 'Bearer token',
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Test': 'bar',
        });
    });

    it('sets the right Accept header for text', () => {
        const defaultOptions: TchefOptions = {
            headers: {
                Accept: 'application/json',
                'Content-type': 'application/json; charset=UTF-8',
            },
        };

        const options: TchefOptions = {
            responseFormat: 'text',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: 'text/*',
            'Content-Type': 'application/json; charset=UTF-8',
        });
    });

    it('sets the right Accept header for blob', () => {
        const defaultOptions: TchefOptions = {
            headers: {
                Accept: 'application/json',
                'Content-type': 'application/json; charset=UTF-8',
            },
        };

        const options: TchefOptions = {
            responseFormat: 'blob',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: '*/*',
            'Content-Type': 'application/json; charset=UTF-8',
        });
    });

    it('sets the right Content-type header for text', () => {
        const defaultOptions: TchefOptions = {
            headers: {
                Accept: 'application/json',
            },
        };

        const options: TchefOptions = {
            method: 'POST',
            responseFormat: 'text',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: 'application/json',
            'Content-Type': 'text/plain; charset=UTF-8',
        });
    });

    it('sets the right Content-type header for blob', () => {
        const defaultOptions: TchefOptions = {
            headers: {
                Accept: 'application/json',
            },
        };

        const options: TchefOptions = {
            method: 'POST',
            responseFormat: 'blob',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: 'application/json',
            'Content-Type': 'application/octet-stream',
        });
    });

    it('sets the right Cache-Control header for no-cache', () => {
        const defaultOptions: TchefOptions = {
            headers: {
                Accept: 'application/json',
            },
        };

        const options: TchefOptions = {
            cacheMaxAge: 0,
            cacheType: 'no-cache',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: 'application/json',
            'Cache-Control': 'no-cache, max-age=0',
        });
    });

    it('sets the right Cache-Control header for private', () => {
        const defaultOptions: TchefOptions = {
            headers: {
                Accept: 'application/json',
            },
        };

        const options: TchefOptions = {
            cacheMaxAge: 60,
            cacheType: 'private',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: 'application/json',
            'Cache-Control': 'private, max-age=60',
        });
    });

    it('sets the right Cache-Control header for public', () => {
        const defaultOptions: TchefOptions = {
            cacheMaxAge: 100,
            cacheType: 'private',
            headers: {
                Accept: 'application/json',
            },
        };

        const options: TchefOptions = {
            cacheMaxAge: 60,
            cacheType: 'public',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: 'application/json',
            'Cache-Control': 'public, max-age=60',
        });
    });

    it('does not override Content-Type when user passes content-type (all lowercase)', () => {
        const defaultOptions: TchefOptions = {};

        const options: TchefOptions = {
            headers: {
                'content-type': 'application/xml',
            },
            method: 'POST',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            'Content-Type': 'application/xml',
        });
    });

    it('does not override Content-Type when user passes Content-type (lowercase t)', () => {
        const defaultOptions: TchefOptions = {};

        const options: TchefOptions = {
            headers: {
                'Content-type': 'application/xml',
            },
            method: 'POST',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            'Content-Type': 'application/xml',
        });
    });

    it('does not override Content-Type when user passes CONTENT-TYPE (all caps)', () => {
        const defaultOptions: TchefOptions = {};

        const options: TchefOptions = {
            headers: {
                'CONTENT-TYPE': 'application/xml',
            },
            method: 'POST',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            'Content-Type': 'application/xml',
        });
    });

    it('does not override Accept when user passes accept (all lowercase)', () => {
        const defaultOptions: TchefOptions = {};

        const options: TchefOptions = {
            headers: {
                accept: 'application/json',
            },
            responseFormat: 'text',
        };

        const result = generateHeaders(defaultOptions, options);

        expect(result).toStrictEqual({
            Accept: 'application/json',
        });
    });
});
