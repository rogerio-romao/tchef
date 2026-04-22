# Tchef

![npm](https://img.shields.io/npm/v/tchef)
![License](https://img.shields.io/npm/l/tchef)
![Build Status](https://img.shields.io/github/actions/workflow/status/rogerio-romao/tchef/ci.yml)
[![JSR](https://jsr.io/badges/@rogerio-romao/tchef)](https://jsr.io/@rogerio-romao/tchef)
[![JSR](https://jsr.io/badges/@rogerio-romao/tchef/score)](https://jsr.io/@rogerio-romao/tchef)

## A better Fetch - with bells and whistles

### Runtimes & Browser Compatibility

Zero runtime dependencies.

Compatible with: ![Node.js](./src/svg/node.svg) ![Deno](./src/svg/deno.svg)
![Bun](./src/svg/bun.svg)
![Cloudflare Workers](./src/svg/cloudflare-workers.svg)

The package is published both on [npm](https://www.npmjs.com/package/tchef/) and
[jsr](https://jsr.io/@rogerio-romao/tchef/). Tested and compatible with the
following:

- Node.js
- Deno
- Bun
- CloudflareWorkers

In browsers, it also works, you will need a bundler to be able to use ESM `import`
syntax, or you can use a CDN script in your html such as this:

```html
<script src="https://unpkg.com/tchef@0.5.0/dist/index.js"></script>
```

### Installation & Basic Usage

```sh
# with pnpm - or use your preferred package manager
pnpm add tchef
```

In your project:

```ts
import tchef from 'tchef';

const res = await tchef('https://jsonplaceholder.typicode.com/posts/1');
console.log(res);
```

So, very simple and at the most basic, the same as using Fetch normaly. Except
the return is a result type, and the call doesn't need to be wrapped on
try/catch. If an error occurs, you get `ok: false`, a statusCode and an error
message returned to you.

To use the JSR version of the package instead, follow the instructions
[here](https://jsr.io/@rogerio-romao/tchef/). It will still work on any of the
compatible runtimes listed above.

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
    ok: false, error: string, statusCode: number;
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
    responseFormat: 'json',
    cacheType: 'private',
    cacheMaxAge: 60,
    timeoutSecs: 'no-limit',
    retries: 0,
    retryDelayMs: 100,
    retryOnValidationFail: false,
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
 { ok: false, error: 'Request timeout', statusCode: 408 }
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
    expect(result.error).toBe('Max retries reached. Not Found');
    expect(result.statusCode).toBe(404);
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

Tchef accepts any schema that implements the [Standard Schema](https://standardschema.dev/)
spec — that includes [Valibot](https://valibot.dev/) (≥1.0), [Zod](https://zod.dev/) (≥3.24),
[ArkType](https://arktype.io/), and others. Bring whichever you already use; tchef has no
runtime dependency on any of them.

By default tchef will not validate payloads. To enable validation, build a schema with
your chosen library and pass it as `validateSchema`:

```ts
// Example using Valibot — any Standard Schema-compliant library works the same way
import { object, number, string, boolean } from 'valibot';

const TodoSchema = object({
    completed: boolean(),
    id: number(),
    title: string(),
    userId: number(),
});

const result = await tchef('https://jsonplaceholder.typicode.com/todos/1', {
    validateSchema: TodoSchema,
});

// result.data is automatically typed as { completed: boolean; id: number; title: string; userId: number }
// No need to pass a <T> generic — the schema drives the type.
```

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
you need, a la GraphQL! 🔥

That is the default behaviour — it is controlled entirely by your schema library.
Check your library's docs for how to configure passthrough (include extra fields)
or strict (reject extra fields) behaviour.

#### Validation errors

On validation failure, tchef returns:

```ts
{ ok: false, error: 'Validation failed: <issues>', statusCode: 409 }
```

The error string includes up to 3 issues from the schema, formatted as `path: message`,
with `(+N more)` appended if there are additional issues beyond the first 3.

#### Retrying on validation failure

By default, validation failures are not retried (they are usually deterministic — the
server returned the wrong shape). If you have a flaky endpoint that occasionally returns
malformed payloads, you can opt in:

```ts
const result = await tchef('https://example.com/data', {
    validateSchema: MySchema,
    retries: 3,
    retryOnValidationFail: true,
});
```

### Roadmap

- Caching options for browser and Node.js runtimes.
- Support for more response formats, like formData, arrayBuffer, etc.
