import { expect, test } from 'vitest';
import tchef from '../index.ts';

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

test('does not crash on invalid url', async () => {
    expect(
        await tchef('https://jsonplaceholder.typicode.com/thisisfake')
    ).toStrictEqual({ ok: false, error: '404 - Not Found' });
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

test('handles errors not caught by response.ok', () => {
    expect(
        async () => await tchef('http://unreachable-url')
    ).not.toThrowError();
});
