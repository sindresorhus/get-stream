import {Buffer} from 'node:buffer';
import {buffer} from 'node:stream/consumers';
import test from 'ava';
import {getStreamAsBuffer, MaxBufferError} from '../source/index.js';
import {createStream} from './helpers/index.js';
import {
	fixtureString,
	fixtureLength,
	fixtureBuffer,
	fixtureTypedArray,
	fixtureArrayBuffer,
	fixtureUint16Array,
	fixtureDataView,
	fixtureMultiString,
	fixtureMultiBuffer,
	fixtureMultiTypedArray,
	fixtureMultiArrayBuffer,
	fixtureMultiUint16Array,
	fixtureMultiDataView,
	fixtureTypedArrayWithOffset,
	fixtureUint16ArrayWithOffset,
	fixtureDataViewWithOffset,
	longString,
	fixtureMultibyteString,
	longMultibyteString,
	bigArray,
} from './fixtures/index.js';

const longBuffer = Buffer.from(longString);
const fixtureMultibyteBuffer = Buffer.from(fixtureMultibyteString);
const longMultibyteBuffer = Buffer.from(longMultibyteString);
const bigBuffer = Buffer.from(bigArray);

const setupBuffer = (streamDefinition, options) => getStreamAsBuffer(createStream(streamDefinition), options);

const getStreamToBuffer = async (t, fixtureValue) => {
	const result = await setupBuffer(fixtureValue);
	t.true(Buffer.isBuffer(result));
	t.true(result.equals(fixtureBuffer));
};

test('get stream from string to buffer, with a single chunk', getStreamToBuffer, [fixtureString]);
test('get stream from buffer to buffer, with a single chunk', getStreamToBuffer, [fixtureBuffer]);
test('get stream from arrayBuffer to buffer, with a single chunk', getStreamToBuffer, [fixtureArrayBuffer]);
test('get stream from typedArray to buffer, with a single chunk', getStreamToBuffer, [fixtureTypedArray]);
test('get stream from typedArray with offset to buffer, with a single chunk', getStreamToBuffer, [fixtureTypedArrayWithOffset]);
test('get stream from uint16Array to buffer, with a single chunk', getStreamToBuffer, [fixtureUint16Array]);
test('get stream from uint16Array with offset to buffer, with a single chunk', getStreamToBuffer, [fixtureUint16ArrayWithOffset]);
test('get stream from dataView to buffer, with a single chunk', getStreamToBuffer, [fixtureDataView]);
test('get stream from dataView with offset to buffer, with a single chunk', getStreamToBuffer, [fixtureDataViewWithOffset]);

test('get stream from string to buffer, with multiple chunks', getStreamToBuffer, fixtureMultiString);
test('get stream from buffer to buffer, with multiple chunks', getStreamToBuffer, fixtureMultiBuffer);
test('get stream from arrayBuffer to buffer, with multiple chunks', getStreamToBuffer, fixtureMultiArrayBuffer);
test('get stream from typedArray to buffer, with multiple chunks', getStreamToBuffer, fixtureMultiTypedArray);
test('get stream from uint16Array to buffer, with multiple chunks', getStreamToBuffer, fixtureMultiUint16Array);
test('get stream from dataView to buffer, with multiple chunks', getStreamToBuffer, fixtureMultiDataView);

const throwOnInvalidChunkType = async (t, fixtureValue) => {
	await t.throwsAsync(setupBuffer([fixtureValue]), {message: /not supported/});
};

test('get stream from object to buffer', throwOnInvalidChunkType, {});
test('get stream from array to buffer', throwOnInvalidChunkType, []);
test('get stream from boolean to buffer', throwOnInvalidChunkType, false);
test('get stream from number to buffer', throwOnInvalidChunkType, 0);
test('get stream from bigint to buffer', throwOnInvalidChunkType, 0n);
test('get stream from undefined to buffer', throwOnInvalidChunkType, undefined);
test('get stream from symbol to buffer', throwOnInvalidChunkType, Symbol('test'));

const checkMaxBuffer = async (t, longValue, shortValue, maxBuffer) => {
	await t.throwsAsync(setupBuffer([longValue], {maxBuffer}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setupBuffer([shortValue], {maxBuffer}));
};

test('maxBuffer throws when size is exceeded with a buffer', checkMaxBuffer, longBuffer, fixtureBuffer, fixtureLength);
test('maxBuffer unit is bytes with getStreamAsBuffer()', checkMaxBuffer, longMultibyteBuffer, fixtureMultibyteBuffer, fixtureMultibyteBuffer.byteLength);

const checkBufferedData = async (t, fixtureValue, expectedResult) => {
	const maxBuffer = expectedResult.length;
	const {bufferedData} = await t.throwsAsync(setupBuffer(fixtureValue, {maxBuffer}), {instanceOf: MaxBufferError});
	t.is(bufferedData.length, maxBuffer);
	t.deepEqual(expectedResult, bufferedData);
};

test(
	'set error.bufferedData when `maxBuffer` is hit, with a single chunk',
	checkBufferedData,
	[fixtureBuffer],
	fixtureBuffer.slice(0, 1),
);
test(
	'set error.bufferedData when `maxBuffer` is hit, with multiple chunks',
	checkBufferedData,
	[fixtureBuffer, fixtureBuffer],
	Buffer.from([...fixtureBuffer, ...fixtureBuffer.slice(0, 1)]),
);

test('getStreamAsBuffer() behaves like buffer()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		buffer(createStream([bigBuffer])),
		setupBuffer([bigBuffer]),
	]);
	t.deepEqual(nativeResult, customResult);
});

test('getStreamAsBuffer() only works in Node', async t => {
	const {Buffer} = globalThis;
	delete globalThis.Buffer;
	try {
		await t.throwsAsync(setupBuffer([fixtureString]), {message: /only supported in Node/});
	} finally {
		globalThis.Buffer = Buffer;
	}
});
