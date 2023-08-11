# get-stream

> Get a stream as a string, Buffer, ArrayBuffer or array

## Features

- Works in any JavaScript environment ([Node.js](#nodejs-streams), [browsers](#web-streams), etc.).
- Supports [text streams](#getstreamstream-options), [binary streams](#getstreamasbufferstream-options) and [object streams](#getstreamasarraystream-options).
- Can set a [maximum stream size](#maxbuffer).
- Returns [partially read data](#errors) when the stream errors.

## Install

```sh
npm install get-stream
```

## Usage

### Node.js streams

```js
import fs from 'node:fs';
import getStream from 'get-stream';

const stream = fs.createReadStream('unicorn.txt');

console.log(await getStream(stream));
/*
              ,,))))))));,
           __)))))))))))))),
\|/       -\(((((''''((((((((.
-*-==//////((''  .     `)))))),
/|\      ))| o    ;-.    '(((((                                  ,(,
         ( `|    /  )    ;))))'                               ,_))^;(~
            |   |   |   ,))((((_     _____------~~~-.        %,;(;(>';'~
            o_);   ;    )))(((` ~---~  `::           \      %%~~)(v;(`('~
                  ;    ''''````         `:       `:::|\,__,%%    );`'; ~
                 |   _                )     /      `:|`----'     `-'
           ______/\/~    |                 /        /
         /~;;.____/;;'  /          ___--,-(   `;;;/
        / //  _;______;'------~~~~~    /;;/\    /
       //  | |                        / ;   \;;,\
      (<_  | ;                      /',/-----'  _>
       \_| ||_                     //~;~~~~~~~~~
           `\_|                   (,~~
                                   \~\
                                    ~~
*/
```

### Web streams

```js
const {body: readableStream} = await fetch('https://example.com');
console.log(await getStream(readableStream));
```

## API

The following methods read the stream's contents and return it as a promise.

### getStream(stream, options?)

`stream`: [`stream.Readable`](https://nodejs.org/api/stream.html#class-streamreadable), [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream), or [`AsyncIterable<string | Buffer | ArrayBuffer | DataView | TypedArray>`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols)\
`options`: [`Options`](#options)

Get the given `stream` as a string.

### getStreamAsBuffer(stream, options?)

Get the given `stream` as a Node.js [`Buffer`](https://nodejs.org/api/buffer.html#class-buffer).

```js
import {getStreamAsBuffer} from 'get-stream';

const stream = fs.createReadStream('unicorn.png');
console.log(await getStreamAsBuffer(stream));
```

### getStreamAsArrayBuffer(stream, options?)

Get the given `stream` as an [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).

```js
import {getStreamAsArrayBuffer} from 'get-stream';

const {body: readableStream} = await fetch('https://example.com');
console.log(await getStreamAsArrayBuffer(readableStream));
```

### getStreamAsArray(stream, options?)

Get the given `stream` as an array. Unlike [other methods](#api), this supports [streams of objects](https://nodejs.org/api/stream.html#object-mode).

```js
import {getStreamAsArray} from 'get-stream';

const {body: readableStream} = await fetch('https://example.com');
console.log(await getStreamAsArray(readableStream));
```

#### options

Type: `object`

##### maxBuffer

Type: `number`\
Default: `Infinity`

Maximum length of the stream. If exceeded, the promise will be rejected with a `MaxBufferError`.

Depending on the [method](#api), the length is measured with [`string.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length), [`buffer.length`](https://nodejs.org/api/buffer.html#buflength), [`arrayBuffer.byteLength`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/byteLength) or [`array.length`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length).

## Errors

If the stream errors, the returned promise will be rejected with the `error`. Any contents already read from the stream will be set to `error.bufferedData`, which is a `string`, a `Buffer`, an `ArrayBuffer` or an array depending on the [method used](#api).

```js
import getStream from 'get-stream';

try {
	await getStream(streamThatErrorsAtTheEnd('unicorn'));
} catch (error) {
	console.log(error.bufferedData);
	//=> 'unicorn'
}
```

## Tips

### `node:stream/consumers`

If you do not need [`maxBuffer`](#maxbuffer), [`error.bufferedData`](#errors) nor browser support, you can use [`node:stream/consumers`](https://nodejs.org/api/webstreams.html#utility-consumers) instead of this package.

```js
import fs from 'node:fs';
import {text, buffer, arrayBuffer} from 'node:stream/consumers';

const stream = fs.createReadStream('unicorn.txt', {encoding: 'utf8'});
console.log(await text(stream))
```

or:

```js
console.log(await buffer(stream))
```

or:

```js
console.log(await arrayBuffer(stream))
```

### Non-UTF-8 encoding

When all of the following conditions apply:
  - [`getStream()`](#getstreamstream-options) is used (as opposed to [`getStreamAsBuffer()`](#getstreamasbufferstream-options) or [`getStreamAsArrayBuffer()`](#getstreamasarraybufferstream-options))
  - The stream is binary (not text)
  - The stream's encoding is not UTF-8 (for example, it is UTF-16, hexadecimal, or Base64)

Then the stream must be decoded using a transform stream like [`TextDecoderStream`](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoderStream) or [`b64`](https://github.com/hapijs/b64).

```js
import getStream from 'get-stream';

const textDecoderStream = new TextDecoderStream('utf-16le');
const {body: readableStream} = await fetch('https://example.com');
console.log(await getStream(readableStream.pipeThrough(textDecoderStream)));
```

### Blobs

[`getStreamAsArrayBuffer()`](#getstreamasarraybufferstream-options) can be used to create [Blobs](https://developer.mozilla.org/en-US/docs/Web/API/Blob).

```js
import {getStreamAsArrayBuffer} from 'get-stream';

const stream = fs.createReadStream('unicorn.txt');
console.log(new Blob([await getStreamAsArrayBuffer(stream)]));
```

## FAQ

### How is this different from [`concat-stream`](https://github.com/maxogden/concat-stream)?

This module accepts a stream instead of being one and returns a promise instead of using a callback. The API is simpler and it only supports returning a string, `Buffer`, an `ArrayBuffer` or an array. It doesn't have a fragile type inference. You explicitly choose what you want. And it doesn't depend on the huge `readable-stream` package.

## Related

- [get-stdin](https://github.com/sindresorhus/get-stdin) - Get stdin as a string or buffer
- [into-stream](https://github.com/sindresorhus/into-stream) - The opposite of this package
