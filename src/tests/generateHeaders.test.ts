import generateHeaders from '@/utils/generateHeaders.ts';
import type { TchefOptions } from '@/types.ts';

// oxlint-disable-next-line max-lines-per-function
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
            Authorization: 'Bearer token',
            'Content-type': 'application/json; charset=UTF-8',
            'x-test': 'bar',
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
            'Content-type': 'application/json; charset=UTF-8',
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
            'Content-type': 'application/json; charset=UTF-8',
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
            'Content-type': 'text/plain; charset=UTF-8',
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
            'Content-type': 'application/octet-stream',
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
});
