# Tchef

## A better Fetch - with bells and whistles

_Warning: this is a heavily wip package that is in initial stages, and also my
first ever package. Use it at your own risk._

It's meant to work on Node and browsers, just assumes a fairly recent version,
since it assumes that it has native Fetch implementation. Recommended Node >=21.

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
be passed in to type the response data for you, otherwise default to unknown. If
it didn't succeed, the error will be a string message with different messages
depending on the type of the error - 404, malformed url, network error, error
parsing the json, etc.

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
AbortController and send its signal using the signal option.

✔︎ **Retries.**

You can set a number of retries for the cases when the fetch fails. By default
it is set to 0. You can also select the amount of delay time in miliseconds to
wait between the retries, by default 100ms. You can also set this option to the
value `'exponential'`, and the delay time will increase exponentially with each
retry, starting at 1sec, then 2, 4 and so on, up to your amount of retries. The
error that happened on the previous attempt gets forwarded to the next attempt,
and will be returned on the last attempt.

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

ROADMAP:

-   validation / type safety on responses
-   more robust caching features
