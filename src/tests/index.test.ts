import { expect, test } from 'vitest';
import tchef from '../index.ts';

test('does a basic fetch', async () => {
    expect(await tchef('https://jsonplaceholder.typicode.com/todos/1'))
        .toMatchInlineSnapshot(`
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
    ).toStrictEqual({ error: 'Not Found' });
});

test('can execute a POST request', async () => {
    expect(
        await tchef('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            body: JSON.stringify({
                title: 'foo',
                body: 'bar',
                userId: 1,
            }),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
    ).toMatchInlineSnapshot(`
        {
          "body": "bar",
          "id": 101,
          "title": "foo",
          "userId": 1,
        }
    `);
});

test('can execute a PUT request', async () => {
    expect(
        await tchef('https://jsonplaceholder.typicode.com/posts/1', {
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
        })
    ).toMatchInlineSnapshot(`
        {
          "body": "bar",
          "id": 1,
          "title": "foo",
          "userId": 1,
        }
    `);
});

test('can execute a DELETE request', async () => {
    expect(
        await tchef('https://jsonplaceholder.typicode.com/posts/1', {
            method: 'DELETE',
        })
    ).toMatchInlineSnapshot(`{}`);
});

test('handles errors not caught by response.ok', () => {
    expect(
        async () => await tchef('http://unreachable-url')
    ).not.toThrowError();
});
