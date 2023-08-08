# get-stream

> Get a stream as a string or buffer

## Features

- Supports both [text streams](#get-stream) and [binary streams](#getstreamasbufferstream-options).
- Can set a [maximum stream size](#maxbuffer).
- Returns [partially read data](#errors) when the stream errors.

## Install

```sh
npm install get-stream
```

## Usage

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

## API

The following methods read the stream's contents and return it as a promise.

### getStream(stream, options?)

`stream`: [`stream.Readable`](https://nodejs.org/api/stream.html#class-streamreadable)
`options`: [`Options`](#options)

Get the given `stream` as a string.

### getStreamAsBuffer(stream, options?)

Get the given `stream` as a buffer.

```js
import {getStreamAsBuffer} from 'get-stream';

const stream = fs.createReadStream('unicorn.png');
console.log(await getStreamAsBuffer(stream));
```

#### options

Type: `object`

##### maxBuffer

Type: `number`\
Default: `Infinity`

Maximum length of the stream. If exceeded, the promise will be rejected with a `MaxBufferError`.

## Errors

If the stream errors, the returned promise will be rejected with the `error`. Any contents already read from the stream will be set to `error.bufferedData`, which is a `string` or a `Buffer` depending on the [method used](#api).

```js
import getStream from 'get-stream';

try {
	await getStream(streamThatErrorsAtTheEnd('unicorn'));
} catch (error) {
	console.log(error.bufferedData);
	//=> 'unicorn'
}
```

## Tip

If you do not need [`maxBuffer`](#maxbuffer) nor [`error.bufferedData`](#errors), you can use [`node:stream/consumers`](https://nodejs.org/api/webstreams.html#utility-consumers) instead of this package.

```js
import fs from 'node:fs';
import {text, buffer} from 'node:stream/consumers';

const stream = fs.createReadStream('unicorn.txt', {encoding: 'utf8'});
console.log(await text(stream))
```

or:

```js
console.log(await buffer(stream))
```

## FAQ

### How is this different from [`concat-stream`](https://github.com/maxogden/concat-stream)?

This module accepts a stream instead of being one and returns a promise instead of using a callback. The API is simpler and it only supports returning a string or buffer. It doesn't have a fragile type inference. You explicitly choose what you want. And it doesn't depend on the huge `readable-stream` package.

## Related

- [get-stdin](https://github.com/sindresorhus/get-stdin) - Get stdin as a string or buffer
- [into-stream](https://github.com/sindresorhus/into-stream) - The opposite of this package
