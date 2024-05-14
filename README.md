# Tchef

## A better Fetch (bells & whistles )

_Warning: this is a heavily wip package that is in initial stages, and also my
first ever package. Use it at your own risk._

It's meant to work on Node and browsers, just assumes a fairly recent version,
since it assumes that it has native Fetch implementation. Recommended Node >=21.

### Features

✔︎ **Result type returns.**

If the fetch is successful, you get an object with

```js
{
    ok: true, data;
}
```

Otherwise, you get

```js
{
    ok: false, error;
}
```

So data will be whatever was the response when the call succeeded. If it didn't
succeed, the error will be a string message with different messages depending on
the type of the error - 404, malformed url, network error, error parsing the
json, etc.

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

ROADMAP:

-   retries
-   more robust caching features
-   validation / type safety on responses
