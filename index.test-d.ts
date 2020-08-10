import * as fs from 'fs';
import {expectType} from 'tsd';
import getStream = require('.');
import {MaxBufferError} from '.';

const stream = fs.createReadStream('foo');

expectType<Promise<string>>(getStream(stream));
expectType<Promise<string>>(getStream(stream, {maxBuffer: 10}));
expectType<Promise<string>>(getStream(stream, {encoding: 'utf8'}));

expectType<Promise<Buffer>>(getStream.buffer(stream));
expectType<Promise<Buffer>>(getStream.buffer(stream, {maxBuffer: 10}));
expectType<Promise<Buffer>>(getStream.buffer(stream, {encoding: 'utf8'}));

expectType<Promise<unknown[]>>(getStream.array(stream));
expectType<Promise<{}[]>>(getStream.array<{}>(stream));
expectType<Promise<unknown[]>>(getStream.array(stream, {maxBuffer: 10}));
expectType<Promise<Buffer[]>>(getStream.array(stream, {encoding: 'buffer'}));
expectType<Promise<Buffer[]>>(
	getStream.array(stream, {maxBuffer: 10, encoding: 'buffer'})
);
expectType<Promise<string[]>>(getStream.array(stream, {encoding: 'utf8'}));
expectType<Promise<string[]>>(
	getStream.array(stream, {maxBuffer: 10, encoding: 'utf8'})
);

const maxBufferError = new MaxBufferError();
expectType<MaxBufferError>(maxBufferError);
