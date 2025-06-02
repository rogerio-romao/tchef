import {
    boolean,
    never,
    nullish,
    number,
    object,
    optional,
    string,
    unknown,
    type Output,
} from 'valibot';
import { describe, expect, expectTypeOf, test } from 'vitest';
import tchef from '../index.ts';

const isCi = process.env.CI === 'true';

describe('URL based tests', () => {
    test('does not crash on invalid url', async () => {
        expect(await tchef('gibberish')).toStrictEqual({
            ok: false,
            error: 'Invalid URL',
            statusCode: 400,
        });
    });

    test('does not crash on 404 url', async () => {
        expect(
            await tchef('https://jsonplaceholder.typicode.com/thisisfake')
        ).toStrictEqual({ ok: false, error: 'Not Found', statusCode: 404 });
    });
});

describe('Basic fetch methods tests', () => {
    test('does a basic fetch', async () => {
        const result = await tchef(
            'https://jsonplaceholder.typicode.com/todos/1'
        );

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

    test('can execute a POST request', async () => {
        const result = await tchef(
            'https://jsonplaceholder.typicode.com/posts',
            {
                method: 'POST',
                body: JSON.stringify({
                    title: 'foo',
                    body: 'bar',
                    userId: 1,
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            }
        );

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

    test('can execute a PUT request', async () => {
        const result = await tchef(
            'https://jsonplaceholder.typicode.com/posts/1',
            {
                method: 'PUT',
                body: JSON.stringify({
                    id: 1,
                    title: 'foo',
                    body: 'bar',
                    userId: 1,
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            }
        );

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

    test('can execute a DELETE request', async () => {
        const result = await tchef(
            'https://jsonplaceholder.typicode.com/posts/1',
            {
                method: 'DELETE',
            }
        );

        if (!result.ok) {
            throw new Error('Request failed');
        }

        expect(result.data).toMatchInlineSnapshot(`{}`);
    });
});

describe('Error handling tests', () => {
    test('handles errors not caught by response.ok', () => {
        expect(
            async () => await tchef('http://unreachable-url')
        ).not.toThrowError();
    });

    // Skip this test in CI because it uses a local server
    test.skipIf(isCi)('does not crash on receiving invalid JSON', async () => {
        expect(await tchef('http://localhost:3000/malformed')).toStrictEqual({
            ok: false,
            error: 'Invalid JSON',
            statusCode: 422,
        });
    });
});

describe('Response type tests', () => {
    test('can receive a text response', async () => {
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

    test('can receive a blob response', async () => {
        const result = await tchef('https://httpbin.org/image/jpeg', {
            responseFormat: 'blob',
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data).toBeInstanceOf(Blob);
    });
});

describe('Timeout and abort tests', () => {
    test('times out correctly', async () => {
        expect(
            await tchef('https://httpbin.org/delay/2', {
                timeoutSecs: 1,
            })
        ).toStrictEqual({
            ok: false,
            error: 'Request timeout',
            statusCode: 408,
        });
    });

    test('can handle an abort', async () => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000);

        expect(
            await tchef('https://httpbin.org/delay/2', {
                signal: controller.signal,
            })
        ).toStrictEqual({
            ok: false,
            error: 'Request aborted',
            statusCode: 499,
        });
    });

    test('doesnt abort if request is already done', async () => {
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

describe('Retry tests', () => {
    test('can retry a 404 request', async () => {
        const result = await tchef(
            'https://jsonplaceholder.typicode.com/thisisfake',
            {
                retries: 2,
            }
        );

        if (!result.ok) {
            expect(result.error).toBe('Max retries reached. Not Found');
        }
    }, 10000);

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
            expect(result.error).toBe(
                'Max retries reached. INTERNAL SERVER ERROR'
            );
            expect(result.statusCode).toBe(500);
        }
    });

    test('doesnt retry on abort', async () => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 1000);

        expect(
            await tchef('https://httpbin.org/delay/2', {
                signal: controller.signal,
                retries: 2,
            })
        ).toStrictEqual({
            ok: false,
            error: 'Request aborted, retries cancelled',
            statusCode: 499,
        });
    });

    test('can retry on timeout', async () => {
        expect(
            await tchef('https://httpbin.org/delay/2', {
                timeoutSecs: 1,
                retries: 2,
            })
        ).toStrictEqual({
            ok: false,
            error: 'Max retries reached. Request timeout',
            statusCode: 408,
        });
    });

    test('can retry on error', async () => {
        expect(
            await tchef('http://unreachable-url', {
                retries: 2,
            })
        ).toStrictEqual({
            ok: false,
            error: 'Max retries reached. fetch failed',
            statusCode: 500,
        });
    });
});

describe('Generic type tests', () => {
    test('can type the response 1', async () => {
        const result = await tchef<{ userId: number }>(
            'https://jsonplaceholder.typicode.com/todos/1'
        );

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data.userId).toBe(1);
    });

    test('can type the response 2', async () => {
        type Todo = {
            userId: number;
            id: number;
            title: string;
            completed: boolean;
        };

        const result = await tchef<Todo>(
            'https://jsonplaceholder.typicode.com/todos/1'
        );

        if (!result.ok) {
            throw new Error(result.error);
        }

        expectTypeOf(result.data).toEqualTypeOf<Todo>();
    });

    test('not passing generic gives unknown', async () => {
        const result = await tchef(
            'https://jsonplaceholder.typicode.com/todos/1'
        );

        if (!result.ok) {
            throw new Error(result.error);
        }

        expectTypeOf(result.data).toEqualTypeOf<unknown>();
    });
});

describe('Validation tests', () => {
    test('can validate the response', async () => {
        const TodoSchema = object({
            userId: number(),
            id: number(),
            title: string(),
            completed: boolean(),
        });

        type Todo = Output<typeof TodoSchema>;

        const result = await tchef<Todo>(
            'https://jsonplaceholder.typicode.com/todos/1',
            {
                validateSchema: TodoSchema,
            }
        );

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

    test('can validate the response with error message when schema incorrect', async () => {
        const TodoSchema = object({
            userId: string(),
            id: boolean(),
            title: number(),
            completed: string(),
        });

        type Todo = Output<typeof TodoSchema>;

        const result = await tchef<Todo>(
            'https://jsonplaceholder.typicode.com/todos/1',
            {
                validateSchema: TodoSchema,
            }
        );

        if (!result.ok) {
            expect(result.error).toBe(
                'Response failed to validate against schema.'
            );
        } else {
            throw new Error('Should have failed validation');
        }
    });

    test('response with more fields than schema still passes', async () => {
        const TodoSchema = object({
            userId: number(),
            id: number(),
            completed: boolean(),
        });

        type Todo = Output<typeof TodoSchema>;

        const result = await tchef<Todo>(
            'https://jsonplaceholder.typicode.com/todos/1',
            {
                validateSchema: TodoSchema,
            }
        );

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

    test('response with less fields than schema fails', async () => {
        const TodoSchema = object({
            userId: number(),
            id: number(),
            title: string(),
            completed: boolean(),
            extraField: string(),
        });

        type Todo = Output<typeof TodoSchema>;

        const result = await tchef<Todo>(
            'https://jsonplaceholder.typicode.com/todos/1',
            {
                validateSchema: TodoSchema,
            }
        );

        if (!result.ok) {
            expect(result.error).toBe(
                'Response failed to validate against schema.'
            );
        } else {
            throw new Error('Should have failed validation');
        }
    });

    test('handles schemas with non-present nullish values', async () => {
        const TodoSchema = object({
            userId: number(),
            id: number(),
            title: string(),
            completed: boolean(),
            extraField: nullish(string()),
        });

        type Todo = Output<typeof TodoSchema>;

        const result = await tchef<Todo>(
            'https://jsonplaceholder.typicode.com/todos/1',
            {
                validateSchema: TodoSchema,
            }
        );

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
    test.skipIf(isCi)(
        'handles schemas with present nullish values',
        async () => {
            const TodoSchema = object({
                id: number(),
                title: string(),
                author: string(),
                comments: nullish(string()),
            });

            type Todo = Output<typeof TodoSchema>;

            const result = await tchef<Todo>('http://localhost:3000/nullish', {
                validateSchema: TodoSchema,
            });

            if (!result.ok) {
                throw new Error(result.error);
            }

            expect(result.data.comments).toBe(null);
        }
    );

    // Skip this test in CI because it uses a local server
    test.skipIf(isCi)('handles schemas with optional fields', async () => {
        const TodoSchema = object({
            id: number(),
            title: string(),
            author: optional(string()),
        });

        type Todo = Output<typeof TodoSchema>;

        const result = await tchef<Todo>('http://localhost:3000/optional', {
            validateSchema: TodoSchema,
        });

        if (!result.ok) {
            throw new Error(result.error);
        }

        expect(result.data.author).toBe(undefined);
        expect(result.data).toMatchInlineSnapshot(`
        {
          "id": 1,
          "title": "foo",
        }
    `);
    });

    test('passing unknown to rest of schema includes all fields', async () => {
        const TodoSchema = object(
            {
                id: number(),
                title: string(),
            },
            unknown()
        );

        type Todo = Output<typeof TodoSchema>;

        const result = await tchef<Todo>(
            'https://jsonplaceholder.typicode.com/todos/1',
            {
                validateSchema: TodoSchema,
            }
        );

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

    test('passing never to rest of schema rejects when there are more fields', async () => {
        const TodoSchema = object(
            {
                id: number(),
                title: string(),
            },
            never()
        );

        type Todo = Output<typeof TodoSchema>;

        const result = await tchef<Todo>(
            'https://jsonplaceholder.typicode.com/todos/1',
            {
                validateSchema: TodoSchema,
            }
        );

        if (!result.ok) {
            expect(result.error).toBe(
                'Response failed to validate against schema.'
            );
        } else {
            throw new Error('Should have failed validation');
        }
    });
});
