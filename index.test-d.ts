import {type Buffer} from 'node:buffer';
import {type Readable} from 'node:stream';
import fs from 'node:fs';
import {expectType, expectError} from 'tsd';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer, MaxBufferError} from './index.js';

const nodeStream = fs.createReadStream('foo') as Readable;

expectType<string>(await getStream(nodeStream));
expectType<string>(await getStream(nodeStream, {maxBuffer: 10}));
expectError(await getStream({}));
expectError(await getStream(nodeStream, {maxBuffer: '10'}));
expectError(await getStream(nodeStream, {unknownOption: 10}));
expectError(await getStream(nodeStream, {maxBuffer: 10}, {}));

expectType<Buffer>(await getStreamAsBuffer(nodeStream));
expectType<Buffer>(await getStreamAsBuffer(nodeStream, {maxBuffer: 10}));
expectError(await getStreamAsBuffer({}));
expectError(await getStreamAsBuffer(nodeStream, {maxBuffer: '10'}));
expectError(await getStreamAsBuffer(nodeStream, {unknownOption: 10}));
expectError(await getStreamAsBuffer(nodeStream, {maxBuffer: 10}, {}));

expectType<ArrayBuffer>(await getStreamAsArrayBuffer(nodeStream));
expectType<ArrayBuffer>(await getStreamAsArrayBuffer(nodeStream, {maxBuffer: 10}));
expectError(await getStreamAsArrayBuffer({}));
expectError(await getStreamAsArrayBuffer(nodeStream, {maxBuffer: '10'}));
expectError(await getStreamAsArrayBuffer(nodeStream, {unknownOption: 10}));
expectError(await getStreamAsArrayBuffer(nodeStream, {maxBuffer: 10}, {}));

expectType<MaxBufferError>(new MaxBufferError());
