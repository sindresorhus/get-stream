import {Buffer, constants as BufferConstants} from 'node:buffer';
import {text} from 'node:stream/consumers';
import test from 'ava';
import getStream, {MaxBufferError} from '../source/index.js';
import {createStream, BIG_TEST_DURATION} from './helpers/index.js';
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

const bigString = Buffer.from(bigArray).toString();
const multiByteString = 'a\u1000';
const multiByteUint8Array = new TextEncoder().encode(multiByteString);
const multiByteBuffer = [...multiByteUint8Array].map(byte => Buffer.from([byte]));
const INVALID_UTF8_MARKER = '\uFFFD';

const setupString = (streamDef, options) => getStream(createStream(streamDef), options);

const getStreamToString = async (t, fixtureValue) => {
	const result = await setupString(fixtureValue);
	t.is(typeof result, 'string');
	t.is(result, fixtureString);
};

test('get stream from string to string, with a single chunk', getStreamToString, [fixtureString]);
test('get stream from buffer to string, with a single chunk', getStreamToString, [fixtureBuffer]);
test('get stream from arrayBuffer to string, with a single chunk', getStreamToString, [fixtureArrayBuffer]);
test('get stream from typedArray to string, with a single chunk', getStreamToString, [fixtureTypedArray]);
test('get stream from typedArray with offset to string, with a single chunk', getStreamToString, [fixtureTypedArrayWithOffset]);
test('get stream from uint16Array to string, with a single chunk', getStreamToString, [fixtureUint16Array]);
test('get stream from uint16Array with offset to string, with a single chunk', getStreamToString, [fixtureUint16ArrayWithOffset]);
test('get stream from dataView to string, with a single chunk', getStreamToString, [fixtureDataView]);
test('get stream from dataView with offset to string, with a single chunk', getStreamToString, [fixtureDataViewWithOffset]);

test('get stream from string to string, with multiple chunks', getStreamToString, fixtureMultiString);
test('get stream from buffer to string, with multiple chunks', getStreamToString, fixtureMultiBuffer);
test('get stream from arrayBuffer to string, with multiple chunks', getStreamToString, fixtureMultiArrayBuffer);
test('get stream from typedArray to string, with multiple chunks', getStreamToString, fixtureMultiTypedArray);
test('get stream from uint16Array to string, with multiple chunks', getStreamToString, fixtureMultiUint16Array);
test('get stream from dataView to string, with multiple chunks', getStreamToString, fixtureMultiDataView);

const throwOnInvalidChunkType = async (t, setupFunction, fixtureValue) => {
	await t.throwsAsync(setupFunction([fixtureValue]), {message: /not supported/});
};

test('get stream from object to string', throwOnInvalidChunkType, setupString, {});
test('get stream from array to string', throwOnInvalidChunkType, setupString, []);
test('get stream from boolean to string', throwOnInvalidChunkType, setupString, false);
test('get stream from number to string', throwOnInvalidChunkType, setupString, 0);
test('get stream from bigint to string', throwOnInvalidChunkType, setupString, 0n);
test('get stream from undefined to string', throwOnInvalidChunkType, setupString, undefined);
test('get stream from symbol to string', throwOnInvalidChunkType, setupString, Symbol('test'));

const checkMaxBuffer = async (t, longValue, shortValue, maxBuffer) => {
	await t.throwsAsync(setupString([longValue], {maxBuffer}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setupString([shortValue], {maxBuffer}));
};

test('maxBuffer throws when size is exceeded with a string', checkMaxBuffer, longString, fixtureString, fixtureLength);
test('maxBuffer unit is characters with getStream()', checkMaxBuffer, longMultibyteString, fixtureMultibyteString, fixtureMultibyteString.length);

const checkBufferedData = async (t, fixtureValue, expectedResult) => {
	const maxBuffer = expectedResult.length;
	const {bufferedData} = await t.throwsAsync(setupString(fixtureValue, {maxBuffer}), {instanceOf: MaxBufferError});
	t.is(bufferedData.length, maxBuffer);
	t.is(expectedResult, bufferedData);
};

test(
	'set error.bufferedData when `maxBuffer` is hit, with a single chunk',
	checkBufferedData,
	[fixtureString],
	fixtureString[0],
);
test(
	'set error.bufferedData when `maxBuffer` is hit, with multiple chunks',
	checkBufferedData,
	[fixtureString, fixtureString],
	`${fixtureString}${fixtureString[0]}`,
);

test('handles streams larger than string max length', async t => {
	t.timeout(BIG_TEST_DURATION);
	const chunkCount = Math.floor(BufferConstants.MAX_STRING_LENGTH / CHUNK_SIZE * 2);
	const chunk = '.'.repeat(CHUNK_SIZE);
	const maxStringChunks = Array.from({length: chunkCount}, () => chunk);
	const {bufferedData} = await t.throwsAsync(setupString(maxStringChunks));
	t.is(bufferedData[0], '.');
});

const CHUNK_SIZE = 2 ** 16;

test('handles streams with a single chunk larger than string max length', async t => {
	const chunks = [Buffer.alloc(BufferConstants.MAX_STRING_LENGTH + 1)];
	const {bufferedData} = await t.throwsAsync(setupString(chunks));
	t.is(bufferedData, '');
});

test('getStream() behaves like text()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		text(createStream([bigString])),
		setupString([bigString]),
	]);
	t.is(nativeResult, customResult);
});

test('get stream with partial UTF-8 sequences', async t => {
	const result = await setupString(multiByteBuffer);
	t.is(result, multiByteString);
});

test('get stream with truncated UTF-8 sequences', async t => {
	const result = await setupString(multiByteBuffer.slice(0, -1));
	t.is(result, `${multiByteString.slice(0, -1)}${INVALID_UTF8_MARKER}`);
});

test('handles truncated UTF-8 sequences over maxBuffer', async t => {
	const maxBuffer = multiByteString.length - 1;
	await t.throwsAsync(setupString(multiByteBuffer.slice(0, -1), {maxBuffer}), {instanceOf: MaxBufferError});
});

test('get stream with invalid UTF-8 sequences', async t => {
	const result = await setupString(multiByteBuffer.slice(1, 2));
	t.is(result, INVALID_UTF8_MARKER);
});
