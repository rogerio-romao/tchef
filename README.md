# Tchef

## A better Fetch - with bells and whistles

_Warning: this is a heavily wip package that is in initial stages, and also my
first ever package. Use it at your own risk._

It's meant to work on Node and browsers, just assumes a fairly recent version,
since it assumes that it has native Fetch implementation. Recommended Node >=21,
although it may work with earlier versions, but you may need to set a flag on
Node. It's also a modern, ESM only module, no other exports provided. It is
written in Typescript and ships with the types, so it's ready to get help from
your IDE on using it and autocompletion.

### Installation & Basic Usage

```sh
npm i tchef
```

In your project:

```ts
import tchef from 'tchef';

const res = await tchef('https://jsonplaceholder.typicode.com/posts/1');
console.log(res);
```

So, very simple and at the most basic, the same as using Fetch normaly. Except
the return is a result type, and the call doesn't need to be wrapped on
try/catch. If an error occurs, you get `ok: false` and an error message returned
to you.

### Features

✔︎ **Result type returns.**

If the fetch is successful, you get an object with

```ts
{
    ok: true, data: T = unknown;
}
```

Otherwise, you get

```ts
{
    ok: false, error: string;
}
```

So data will be whatever was the response when the call succeeded. A generic can
be passed in to type the response data for you, otherwise it defaults to
unknown. If it didn't succeed, the error will be a string message with different
messages depending on the type of the error - 404, malformed url, network error,
error parsing the json, etc.

That means calling Tchef should not need to be wrapped around a try-catch,
instead it will always return and you only need to check for the ok property -
if it's true, you are guaranteed to have data, if it is false, you are
guaranteed to have a descriptive error message.

✔︎ **Options.**

Currently supports options for `GET, POST, PUT, DELETE` methods; for creating
and sending headers, for `json, text, blob` response type and parsing, for
creating and sending search params, and for selecting different types of
caching.

Default options:

```js
{
    method: 'GET',
    headers: {
        Accept: 'application/json',
    },
    responseFormat: 'json',
    cacheType: 'private',
    cacheMaxAge: 60,
    timeoutSecs: 'no-limit',
    retries: 0,
    retryDelayMs: 100,
};
```

✔︎ **Timeout & Abort.**

You can set optional timeout in seconds (default no time limit, meaning it will
be handled by the browser or runtime). You can also optionally create an
AbortController and send its signal using the signal option. Example of setting
a timeout for 1 second:

```ts
 await tchef('https://httpbin.org/delay/2', { timeoutSecs: 1 });
 // that url will only reply after 2 seconds, so this will return:
 { ok: false, error: 'Request timeout' }
```

This way you can send an abort signal, that could be triggered by a button on
your app instead of a `setTimeout` as in the example:

```ts
const controller = new AbortController();
setTimeout(() => controller.abort(), 1000);

await tchef('https://httpbin.org/delay/2', { signal: controller.signal });
```

✔︎ **Retries.**

You can set a number of retries for the cases when the fetch fails. By default
it is set to 0. You can also select the amount of delay time in miliseconds to
wait between the retries, by default 100ms. You can also set this option to the
value `'exponential'`, and the delay time will increase exponentially with each
retry, starting at 1sec, then 2, 4 and so on, up to your amount of retries. The
error that happened on the previous attempt gets forwarded to the next attempt,
and will be returned on the last attempt.

```ts
const result = await tchef('https://thisisfake.url', { retries: 2 });

if (!result.ok) {
    expect(result.error).toBe('Max retries reached. 404 - Not Found');
}
```

✔︎ **Generic typing.**

A type can be passed in to Tchef, that will be used to type the returned data.
This is not the same as validating that the data is actually the correct type,
it is just doing a typecast, so you get autocomplete and errors on the IDE when
trying to access properties on the type. It is essentially the same as doing
this:

```ts
type something = { some: string; thing: string };
const response = await fetch('https://some.website.com');
if (!response.ok) {
    // handle error
}
const data = (await response.json()) as something;
```

But since Tchef wraps around Fetch, we instead do that like this:

```ts
const response = await tchef<something>('https://some.website.com');
```

And the result is the same, the response is typed as `something`. If nothing is
passed, the response will default to type `unknown`.

✔︎ **Validating JSON payloads.**

We use [Valibot](https://valibot.dev/) for validation. It's beyond the scope for
us to explain how that works in detail, so follow the link for docs and guides.
But it's a very lightweight and tree-shakeable library similar to Zod and
others. By default Tchef will not validate payloads. To do that, you have to set
up your expected schema using Valibot, then pass that in the options as such:
`{ validateSchema: SomeValidValibotSchema }`. A more detailed example here:

```ts
const TodoSchema = object({
    userId: number(),
    id: number(),
    title: string(),
    completed: boolean(),
});

const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
    validateSchema: TodoSchema,
});
```

So, the only thing you need to have the payload validated is that. If you don't
set the validateSchema property in the options, there is no validation. Although
you can still use a generic as detailed above on this document.

So, there are 3 levels to the security you have about your response. At the most
basic, with no validation or generic, the response data will be typed as
`unknown` - already better than the `any` from a normal Fetch. By creating a TS
type and passing it as a generic to the Tchef call, you get the response data
type coerced into the expected type, with autocomplete and errors on IDE, but no
real assurance that the data we got back is actually that type. By using the
validation feature, you get the data correctly typed, and assurance that it was
what you actually got back - at runtime! 🔥

Another bonus feature of the validation feature: if you expect the response to
be a huge payload with dozens of fields, but you only really care about 5 or
6... you can create the schema with only those, and by default the response will
still validate correctly (as long as those 5 or 6 were correct), and the return
data will be stripped of the fields not in the schema, giving you back just what
you need! 🔥

That is the default behaviour. You can also make it fail validation if there are
more fields than your schema has, or still include those extra fields in the
returned data instead of stripping them. The only change needed for this is on
your Valibot schema. Example for including the extra fields:

```ts
const TodoSchema = object(
    {
        id: number(),
        title: string(),
    },
    unknown()
);

await tchef('https://example.com/todo/1', { validateSchema: TodoSchema });
```

The key is the `unknown()` call on the second argument - this will pass through
the extra fields. If you set it to `never()` instead, validation will error out
and tchef will return
`{ ok: false, error: 'Response failed to validate against schema.' }`. Again,
check [Valibot](https://valibot.dev/) for more information on it's features.

ROADMAP:

-   more robust caching features
