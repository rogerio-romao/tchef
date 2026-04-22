// oxlint-disable vitest/no-conditional-in-test, vitest/no-conditional-expect -- need to check for result.ok
// oxlint-disable vitest/no-standalone-expect -- the skipIf(CI) trip it up
// oxlint-disable max-lines

import {
    boolean,
    looseObject,
    nullish,
    number,
    object,
    optional,
    strictObject,
    string,
} from 'valibot';

import tchef from '@/index.ts';

// oxlint-disable-next-line node/no-process-env
const isCi = process.env.CI === 'true';

describe('uRL based tests', () => {
    it('does not crash on invalid url', async () => {
        await expect(tchef('gibberish')).resolves.toStrictEqual({
            error: 'Invalid URL',
            ok: false,
            statusCode: 400,
        });
    });

    it('does not crash on 404 url', async () => {
        await expect(
            tchef('https://jsonplaceholder.typicode.com/thisisfake'),
        ).resolves.toStrictEqual({
            error: 'Not Found',
            ok: false,
            statusCode: 404,
        });
    });
});

describe('basic fetch methods tests', () => {
    it('does a basic fetch', async () => {
        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1');

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toMatchInlineSnapshot(`
        {
          "completed": false,
          "id": 1,
          "title": "delectus aut autem",
          "userId": 1,
        }
    `);
    });

    it('can execute a POST request', async () => {
        const result = await tchef('https://jsonplaceholder.typicode.com/posts', {
            body: JSON.stringify({
                body: 'bar',
                title: 'foo',
                userId: 1,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
            method: 'POST',
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toMatchInlineSnapshot(`
        {
          "body": "bar",
          "id": 101,
          "title": "foo",
          "userId": 1,
        }
    `);
    });

    it('can execute a PUT request', async () => {
        const result = await tchef('https://jsonplaceholder.typicode.com/posts/1', {
            body: JSON.stringify({
                body: 'bar',
                id: 1,
                title: 'foo',
                userId: 1,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
            method: 'PUT',
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toMatchInlineSnapshot(`
        {
          "body": "bar",
          "id": 1,
          "title": "foo",
          "userId": 1,
        }
    `);
    });

    it('can execute a DELETE request', async () => {
        const result = await tchef('https://jsonplaceholder.typicode.com/posts/1', {
            method: 'DELETE',
        });

        if (!result.ok) {
            throw new Error('Request failed');
        }

        expect(result.data).toMatchInlineSnapshot(`{}`);
    });
});

describe('error handling tests', () => {
    it('handles errors not caught by response.ok', async () => {
        await expect(tchef('http://unreachable-url')).resolves.not.toThrow();
    });

    // Skip this test in CI because it uses a local server
    test.skipIf(isCi)('does not crash on receiving invalid JSON', async () => {
        await expect(tchef('http://localhost:3000/malformed')).resolves.toStrictEqual({
            error: 'Invalid JSON',
            ok: false,
            statusCode: 422,
        });
    });
});

describe('response type tests', () => {
    it('can receive a text response', async () => {
        const result = await tchef('https://httpbin.org/robots.txt', {
            responseFormat: 'text',
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toMatchInlineSnapshot(`
        "User-agent: *
        Disallow: /deny
        "
    `);
    });

    it('can receive a blob response', async () => {
        const result = await tchef('https://httpbin.org/image/jpeg', {
            responseFormat: 'blob',
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toBeInstanceOf(Blob);
    });
});

describe('timeout and abort tests', () => {
    it('times out correctly', async () => {
        await expect(
            tchef('https://httpbin.org/delay/2', {
                timeoutSecs: 1,
            }),
        ).resolves.toStrictEqual({
            error: 'Request timeout',
            ok: false,
            statusCode: 408,
        });
    });

    it('can handle an abort', async () => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000);

        await expect(
            tchef('https://httpbin.org/delay/2', {
                signal: controller.signal,
            }),
        ).resolves.toStrictEqual({
            error: 'Request aborted',
            ok: false,
            statusCode: 499,
        });
    });

    test.skipIf(isCi)('doesnt abort if request is already done', async () => {
        const result = await tchef('https://httpbin.org/delay/1', {
            timeoutSecs: 2,
        });
        expect(result).toMatchObject({ ok: true });
    });

    test.skipIf(isCi)('doesnt timeout if no limit is set', async () => {
        const result = await tchef('https://httpbin.org/delay/4', {
            timeoutSecs: 'no-limit',
        });
        expect(result).toMatchObject({ ok: true });
    });
});

describe('retry tests', () => {
    it('can retry a 404 request', async () => {
        const result = await tchef('https://jsonplaceholder.typicode.com/thisisfake', {
            retries: 2,
        });

        if (!result.ok) {
            expect(result.error).toBe('Max retries reached. Not Found');
        }
    }, 10_000);

    test.skipIf(isCi)('can retry malformed JSON', async () => {
        const result = await tchef('http://localhost:3000/malformed', {
            retries: 2,
        });

        if (!result.ok) {
            expect(result.error).toBe('Max retries reached. Invalid JSON');
        }
    });

    test.skipIf(isCi)('can retry a 500 request', async () => {
        const result = await tchef('https://httpbin.org/status/500', {
            retries: 2,
        });

        if (!result.ok) {
            expect(result.error).toBe('Max retries reached. INTERNAL SERVER ERROR');
            expect(result.statusCode).toBe(500);
        }
    });

    it('doesnt retry on abort', async () => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000);

        await expect(
            tchef('https://httpbin.org/delay/2', {
                retries: 2,
                signal: controller.signal,
            }),
        ).resolves.toStrictEqual({
            error: 'Request aborted, retries cancelled',
            ok: false,
            statusCode: 499,
        });
    });

    it('can retry on timeout', async () => {
        await expect(
            tchef('https://httpbin.org/delay/2', {
                retries: 2,
                timeoutSecs: 1,
            }),
        ).resolves.toStrictEqual({
            error: 'Max retries reached. Request timeout',
            ok: false,
            statusCode: 408,
        });
    });

    it('can retry on error', async () => {
        await expect(
            tchef('http://unreachable-url', {
                retries: 2,
            }),
        ).resolves.toStrictEqual({
            error: 'Max retries reached. fetch failed',
            ok: false,
            statusCode: 500,
        });
    });
});

describe('generic type tests', () => {
    it('can type the response 1', async () => {
        const result = await tchef<{ userId: number }>(
            'https://jsonplaceholder.typicode.com/todos/1',
        );

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data.userId).toBe(1);
    });

    it('can type the response 2', async () => {
        interface Todo {
            userId: number;
            id: number;
            title: string;
            completed: boolean;
        }

        const result = await tchef<Todo>('https://jsonplaceholder.typicode.com/todos/1');

        if (!result.ok) {
            throw new Error(result.error);
        }

        expectTypeOf(result.data).toEqualTypeOf<Todo>();
    });

    it('not passing generic gives unknown', async () => {
        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1');

        if (!result.ok) {
            throw new Error(result.error);
        }

        expectTypeOf(result.data).toEqualTypeOf<unknown>();
    });
});

// oxlint-disable-next-line max-lines-per-function, max-statements -- this is just more convenient to have all validation tests together
describe('validation tests', () => {
    it('can validate the response', async () => {
        const TodoSchema = object({
            completed: boolean(),
            id: number(),
            title: string(),
            userId: number(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            validateSchema: TodoSchema,
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toMatchInlineSnapshot(`
        {
          "completed": false,
          "id": 1,
          "title": "delectus aut autem",
          "userId": 1,
        }
    `);
    });

    it('can validate the response with error message when schema incorrect', async () => {
        const TodoSchema = object({
            completed: string(),
            id: boolean(),
            title: number(),
            userId: string(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            validateSchema: TodoSchema,
        });

        if (result.ok === false) {
            expect(result.error).toMatch(/^Validation failed:/);
            expect(result.error).toContain('completed');
        } else {
            throw new Error('Should have failed validation');
        }
    });

    it('response with more fields than schema still passes', async () => {
        const TodoSchema = object({
            completed: boolean(),
            id: number(),
            userId: number(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            validateSchema: TodoSchema,
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toMatchInlineSnapshot(`
        {
          "completed": false,
          "id": 1,
          "userId": 1,
        }
    `);
    });

    it('response with less fields than schema fails', async () => {
        const TodoSchema = object({
            completed: boolean(),
            extraField: string(),
            id: number(),
            title: string(),
            userId: number(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            validateSchema: TodoSchema,
        });

        if (result.ok === false) {
            expect(result.error).toMatch(/^Validation failed:/);
            expect(result.error).toContain('extraField');
        } else {
            throw new Error('Should have failed validation');
        }
    });

    it('handles schemas with non-present nullish values', async () => {
        const TodoSchema = object({
            completed: boolean(),
            extraField: nullish(string()),
            id: number(),
            title: string(),
            userId: number(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            validateSchema: TodoSchema,
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toMatchInlineSnapshot(`
        {
          "completed": false,
          "id": 1,
          "title": "delectus aut autem",
          "userId": 1,
        }
    `);
    });

    // Skip this test in CI because it uses a local server
    test.skipIf(isCi)('handles schemas with present nullish values', async () => {
        const TodoSchema = object({
            author: string(),
            comments: nullish(string()),
            id: number(),
            title: string(),
        });

        const result = await tchef('http://localhost:3000/nullish', {
            validateSchema: TodoSchema,
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data.comments).toBeNull();
    });

    // Skip this test in CI because it uses a local server
    test.skipIf(isCi)('handles schemas with optional fields', async () => {
        const TodoSchema = object({
            author: optional(string()),
            id: number(),
            title: string(),
        });

        const result = await tchef('http://localhost:3000/optional', {
            validateSchema: TodoSchema,
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data.author).toBeUndefined();
        expect(result.data).toMatchInlineSnapshot(`
        {
          "id": 1,
          "title": "foo",
        }
    `);
    });

    it('passing unknown to rest of schema includes all fields', async () => {
        const TodoSchema = looseObject({
            id: number(),
            title: string(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            validateSchema: TodoSchema,
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toMatchInlineSnapshot(`
        {
          "completed": false,
          "id": 1,
          "title": "delectus aut autem",
          "userId": 1,
        }
    `);
    });

    it('passing never to rest of schema rejects when there are more fields', async () => {
        const TodoSchema = strictObject({
            id: number(),
            title: string(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            validateSchema: TodoSchema,
        });

        if (result.ok === false) {
            expect(result.error).toMatch(/^Validation failed:/);
        } else {
            throw new Error('Should have failed validation');
        }
    });

    it('validation error includes up to 3 issues with (+N more) suffix when more exist', async () => {
        // Schema with 5 wrong field types — response has boolean/number/string/number, so all 5 fail
        const TodoSchema = object({
            completed: string(),
            extraField: number(),
            id: boolean(),
            title: number(),
            userId: string(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            validateSchema: TodoSchema,
        });

        if (result.ok === false) {
            expect(result.error).toMatch(/^Validation failed:/);
            expect(result.error).toContain('(+');
        } else {
            throw new Error('Should have failed validation');
        }
    });

    it('retryOnValidationFail retries on schema mismatch and eventually returns max retries error', async () => {
        // Schema intentionally wrong — will always fail against the real response
        const TodoSchema = object({
            completed: string(),
            id: boolean(),
        });

        const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
            retries: 2,
            retryOnValidationFail: true,
            validateSchema: TodoSchema,
        });

        if (result.ok === false) {
            expect(result.error).toMatch(/^Max retries reached\./);
        } else {
            throw new Error('Should have failed validation');
        }
    });
});
