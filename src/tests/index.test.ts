import { expect, test } from 'vitest';
import tchef from '../index.ts';

// URL BASED TESTS

test('does not crash on invalid url', async () => {
    expect(await tchef('gibberish')).toStrictEqual({
        ok: false,
        error: 'Invalid URL',
    });
});

test('does not crash on 404 url', async () => {
    expect(
        await tchef('https://jsonplaceholder.typicode.com/thisisfake')
    ).toStrictEqual({ ok: false, error: '404 - Not Found' });
});

// BASIC FETCH METHODS TESTS

test('does a basic fetch', async () => {
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

test('can execute a POST request', async () => {
    const result = await tchef('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: JSON.stringify({
            title: 'foo',
            body: 'bar',
            userId: 1,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
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

test('can execute a PUT request', async () => {
    const result = await tchef('https://jsonplaceholder.typicode.com/posts/1', {
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

test('can execute a DELETE request', async () => {
    const result = await tchef('https://jsonplaceholder.typicode.com/posts/1', {
        method: 'DELETE',
    });

    if (!result.ok) {
        throw new Error('Request failed');
    }

    expect(result.data).toMatchInlineSnapshot(`{}`);
});

// ERROR HANDLING TESTS

test('handles errors not caught by response.ok', () => {
    expect(
        async () => await tchef('http://unreachable-url')
    ).not.toThrowError();
});

// Skip this test in CI because it uses a local server
if (process.env.CI !== 'true') {
    test('does not crash on receiving invalid JSON', async () => {
        expect(await tchef('http://localhost:3000/malformed')).toStrictEqual({
            ok: false,
            error: 'Invalid JSON',
        });
    });
}

// RESPONSE TYPE TESTS

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

// TIMEOUT AND ABORT TESTS

test('can handle a timeout', async () => {
    expect(
        await tchef('https://httpbin.org/delay/2', {
            timeout: 1,
        })
    ).toStrictEqual({ ok: false, error: 'Request timeout' });
});

test('can handle an abort', async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000);

    expect(
        await tchef('https://httpbin.org/delay/2', {
            signal: controller.signal,
        })
    ).toStrictEqual({ ok: false, error: 'Request aborted' });
});

test('doesnt abort if request is already done', async () => {
    expect(
        await tchef('https://httpbin.org/delay/1', {
            timeout: 2,
        })
    ).toMatchObject({ ok: true });
});

test('doesnt timeout if no limit is set', async () => {
    expect(
        await tchef('https://httpbin.org/delay/4', {
            timeout: 'no-limit',
        })
    ).toMatchObject({ ok: true });
});
