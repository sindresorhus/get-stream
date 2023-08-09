import {type Readable} from 'node:stream';
import {type Buffer} from 'node:buffer';

export class MaxBufferError extends Error {
	readonly name: 'MaxBufferError';
	constructor();
}

type StreamItem = string | Buffer | ArrayBuffer | ArrayBufferView;
export type AnyStream = Readable | ReadableStream<StreamItem> | AsyncIterable<StreamItem>;

export type Options = {
	/**
	Maximum length of the stream. If exceeded, the promise will be rejected with a `MaxBufferError`.

	@default Infinity
	*/
	readonly maxBuffer?: number;
};

/**
Get the given `stream` as a string.

@returns The stream's contents as a promise.

@example
```
import fs from 'node:fs';
import getStream from 'get-stream';

const stream = fs.createReadStream('unicorn.txt');

console.log(await getStream(stream));
//               ,,))))))));,
//            __)))))))))))))),
// \|/       -\(((((''''((((((((.
// -*-==//////((''  .     `)))))),
// /|\      ))| o    ;-.    '(((((                                  ,(,
//          ( `|    /  )    ;))))'                               ,_))^;(~
//             |   |   |   ,))((((_     _____------~~~-.        %,;(;(>';'~
//             o_);   ;    )))(((` ~---~  `::           \      %%~~)(v;(`('~
//                   ;    ''''````         `:       `:::|\,__,%%    );`'; ~
//                  |   _                )     /      `:|`----'     `-'
//            ______/\/~    |                 /        /
//          /~;;.____/;;'  /          ___--,-(   `;;;/
//         / //  _;______;'------~~~~~    /;;/\    /
//        //  | |                        / ;   \;;,\
//       (<_  | ;                      /',/-----'  _>
//        \_| ||_                     //~;~~~~~~~~~
//            `\_|                   (,~~
//                                    \~\
//                                     ~~
```

@example
```
const {body: readableStream} = await fetch('https://example.com');
console.log(await getStream(readableStream));
```
*/
export default function getStream(stream: AnyStream, options?: Options): Promise<string>;

/**
Get the given `stream` as a Node.js [`Buffer`](https://nodejs.org/api/buffer.html#class-buffer).

@returns The stream's contents as a promise.

@example
```
import {getStreamAsBuffer} from 'get-stream';

const stream = fs.createReadStream('unicorn.png');
console.log(await getStreamAsBuffer(stream));
```
*/
export function getStreamAsBuffer(stream: AnyStream, options?: Options): Promise<Buffer>;

/**
Get the given `stream` as an [`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).

@returns The stream's contents as a promise.

@example
```
import {getStreamAsArrayBuffer} from 'get-stream';

const {body: readableStream} = await fetch('https://example.com');
console.log(await getStreamAsArrayBuffer(readableStream));
```
*/
export function getStreamAsArrayBuffer(stream: AnyStream, options?: Options): Promise<ArrayBuffer>;
