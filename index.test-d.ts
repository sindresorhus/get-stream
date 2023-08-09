import {Buffer} from 'node:buffer';
import {open} from 'node:fs/promises';
import {type Readable} from 'node:stream';
import fs from 'node:fs';
import {expectType, expectError, expectAssignable, expectNotAssignable} from 'tsd';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer, MaxBufferError, type Options, type AnyStream} from './index.js';

const nodeStream = fs.createReadStream('foo') as Readable;

const fileHandle = await open('test');
const readableStream = fileHandle.readableWebStream();

const asyncIterable = <T>(value: T): AsyncGenerator<T> => (async function * () {
	yield value;
})();
const stringAsyncIterable = asyncIterable('');
const bufferAsyncIterable = asyncIterable(Buffer.from(''));
const arrayBufferAsyncIterable = asyncIterable(new ArrayBuffer(0));
const dataViewAsyncIterable = asyncIterable(new DataView(new ArrayBuffer(0)));
const typedArrayAsyncIterable = asyncIterable(new Uint8Array([]));
const objectAsyncIterable = asyncIterable({});

expectType<string>(await getStream(nodeStream));
expectType<string>(await getStream(nodeStream, {maxBuffer: 10}));
expectType<string>(await getStream(readableStream));
expectType<string>(await getStream(stringAsyncIterable));
expectType<string>(await getStream(bufferAsyncIterable));
expectType<string>(await getStream(arrayBufferAsyncIterable));
expectType<string>(await getStream(dataViewAsyncIterable));
expectType<string>(await getStream(typedArrayAsyncIterable));
expectError(await getStream(objectAsyncIterable));
expectError(await getStream({}));
expectError(await getStream(nodeStream, {maxBuffer: '10'}));
expectError(await getStream(nodeStream, {unknownOption: 10}));
expectError(await getStream(nodeStream, {maxBuffer: 10}, {}));

expectType<Buffer>(await getStreamAsBuffer(nodeStream));
expectType<Buffer>(await getStreamAsBuffer(nodeStream, {maxBuffer: 10}));
expectType<Buffer>(await getStreamAsBuffer(readableStream));
expectType<Buffer>(await getStreamAsBuffer(stringAsyncIterable));
expectType<Buffer>(await getStreamAsBuffer(bufferAsyncIterable));
expectType<Buffer>(await getStreamAsBuffer(arrayBufferAsyncIterable));
expectType<Buffer>(await getStreamAsBuffer(dataViewAsyncIterable));
expectType<Buffer>(await getStreamAsBuffer(typedArrayAsyncIterable));
expectError(await getStreamAsBuffer(objectAsyncIterable));
expectError(await getStreamAsBuffer({}));
expectError(await getStreamAsBuffer(nodeStream, {maxBuffer: '10'}));
expectError(await getStreamAsBuffer(nodeStream, {unknownOption: 10}));
expectError(await getStreamAsBuffer(nodeStream, {maxBuffer: 10}, {}));

expectType<ArrayBuffer>(await getStreamAsArrayBuffer(nodeStream));
expectType<ArrayBuffer>(await getStreamAsArrayBuffer(nodeStream, {maxBuffer: 10}));
expectType<ArrayBuffer>(await getStreamAsArrayBuffer(readableStream));
expectType<ArrayBuffer>(await getStreamAsArrayBuffer(stringAsyncIterable));
expectType<ArrayBuffer>(await getStreamAsArrayBuffer(bufferAsyncIterable));
expectType<ArrayBuffer>(await getStreamAsArrayBuffer(arrayBufferAsyncIterable));
expectType<ArrayBuffer>(await getStreamAsArrayBuffer(dataViewAsyncIterable));
expectType<ArrayBuffer>(await getStreamAsArrayBuffer(typedArrayAsyncIterable));
expectError(await getStreamAsArrayBuffer(objectAsyncIterable));
expectError(await getStreamAsArrayBuffer({}));
expectError(await getStreamAsArrayBuffer(nodeStream, {maxBuffer: '10'}));
expectError(await getStreamAsArrayBuffer(nodeStream, {unknownOption: 10}));
expectError(await getStreamAsArrayBuffer(nodeStream, {maxBuffer: 10}, {}));

expectAssignable<AnyStream>(nodeStream);
expectAssignable<AnyStream>(readableStream);
expectAssignable<AnyStream>(stringAsyncIterable);
expectAssignable<AnyStream>(bufferAsyncIterable);
expectAssignable<AnyStream>(arrayBufferAsyncIterable);
expectAssignable<AnyStream>(dataViewAsyncIterable);
expectAssignable<AnyStream>(typedArrayAsyncIterable);
expectNotAssignable<AnyStream>({});

expectAssignable<Options>({maxBuffer: 10});
expectNotAssignable<Options>({maxBuffer: '10'});
expectNotAssignable<Options>({unknownOption: 10});

expectType<MaxBufferError>(new MaxBufferError());
