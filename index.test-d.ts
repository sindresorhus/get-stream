import {type Buffer} from 'node:buffer';
import {type Stream} from 'node:stream';
import fs from 'node:fs';
import {expectType} from 'tsd';
import getStream, {getStreamAsBuffer, MaxBufferError} from './index.js';

const stream = fs.createReadStream('foo') as Stream;

expectType<Promise<string>>(getStream(stream));
expectType<Promise<string>>(getStream(stream, {maxBuffer: 10}));
expectType<Promise<string>>(getStream(stream, {encoding: 'utf8'}));

expectType<Promise<Buffer>>(getStreamAsBuffer(stream));
expectType<Promise<Buffer>>(getStreamAsBuffer(stream, {maxBuffer: 10}));

const maxBufferError = new MaxBufferError();
expectType<MaxBufferError>(maxBufferError);
