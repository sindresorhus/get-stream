import {type Readable} from 'node:stream';
import {type Buffer} from 'node:buffer';

export class MaxBufferError extends Error {
	readonly name: 'MaxBufferError';
	constructor();
}

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
*/
export default function getStream(stream: Readable, options?: Options): Promise<string>;

/**
Get the given `stream` as a buffer.

@returns The stream's contents as a promise.

@example
```
import {getStreamAsBuffer} from 'get-stream';

const stream = fs.createReadStream('unicorn.png');
console.log(await getStreamAsBuffer(stream));
```
*/
export function getStreamAsBuffer(stream: Readable, options?: Options): Promise<Buffer>;
