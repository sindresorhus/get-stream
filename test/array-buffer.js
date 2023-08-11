import {Buffer, constants as BufferConstants, Blob} from 'node:buffer';
import {arrayBuffer, blob} from 'node:stream/consumers';
import test from 'ava';
import {getStreamAsArrayBuffer, MaxBufferError} from '../index.js';
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
	bigArray,
} from './fixtures/index.js';

const longTypedArray = new TextEncoder().encode(longString);
const longArrayBuffer = longTypedArray.buffer;
const longUint16Array = new Uint16Array(longArrayBuffer);
const longDataView = new DataView(longArrayBuffer);
const fixtureMultibyteUint16Array = new Uint16Array([0, 0]);
const longMultibyteUint16Array = new Uint16Array([0, 0, 0]);
const bigArrayBuffer = new Uint8Array(bigArray).buffer;

const setupArrayBuffer = (streamDef, options) => getStreamAsArrayBuffer(createStream(streamDef), options);

const getStreamToArrayBuffer = async (t, fixtureValue) => {
	const result = await setupArrayBuffer(fixtureValue);
	t.true(result instanceof ArrayBuffer);
	t.true(Buffer.from(result).equals(fixtureBuffer));
};

test('get stream from string to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureString]);
test('get stream from buffer to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureBuffer]);
test('get stream from arrayBuffer to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureArrayBuffer]);
test('get stream from typedArray to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureTypedArray]);
test('get stream from typedArray with offset to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureTypedArrayWithOffset]);
test('get stream from uint16Array to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureUint16Array]);
test('get stream from uint16Array with offset to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureUint16ArrayWithOffset]);
test('get stream from dataView to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureDataView]);
test('get stream from dataView with offset to arrayBuffer, with a single chunk', getStreamToArrayBuffer, [fixtureDataViewWithOffset]);

test('get stream from string to arrayBuffer, with multiple chunks', getStreamToArrayBuffer, fixtureMultiString);
test('get stream from buffer to arrayBuffer, with multiple chunks', getStreamToArrayBuffer, fixtureMultiBuffer);
test('get stream from arrayBuffer to arrayBuffer, with multiple chunks', getStreamToArrayBuffer, fixtureMultiArrayBuffer);
test('get stream from typedArray to arrayBuffer, with multiple chunks', getStreamToArrayBuffer, fixtureMultiTypedArray);
test('get stream from uint16Array to arrayBuffer, with multiple chunks', getStreamToArrayBuffer, fixtureMultiUint16Array);
test('get stream from dataView to arrayBuffer, with multiple chunks', getStreamToArrayBuffer, fixtureMultiDataView);

const throwOnInvalidChunkType = async (t, fixtureValue) => {
	await t.throwsAsync(setupArrayBuffer([fixtureValue]), {message: /not supported/});
};

test('get stream from bigint to arrayBuffer', throwOnInvalidChunkType, 0n);
test('get stream from number to arrayBuffer', throwOnInvalidChunkType, 0);
test('get stream from array to arrayBuffer', throwOnInvalidChunkType, []);
test('get stream from object to arrayBuffer', throwOnInvalidChunkType, {});
test('get stream from boolean to arrayBuffer', throwOnInvalidChunkType, false);
test('get stream from undefined to arrayBuffer', throwOnInvalidChunkType, undefined);
test('get stream from symbol to arrayBuffer', throwOnInvalidChunkType, Symbol('test'));

const checkMaxBuffer = async (t, longValue, shortValue, maxBuffer) => {
	await t.throwsAsync(setupArrayBuffer([longValue], {maxBuffer}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setupArrayBuffer([shortValue], {maxBuffer}));
};

test('maxBuffer throws when size is exceeded with an arrayBuffer', checkMaxBuffer, longArrayBuffer, fixtureArrayBuffer, fixtureLength);
test('maxBuffer throws when size is exceeded with a typedArray', checkMaxBuffer, longTypedArray, fixtureTypedArray, fixtureLength);
test('maxBuffer throws when size is exceeded with an uint16Array', checkMaxBuffer, longUint16Array, fixtureUint16Array, fixtureLength);
test('maxBuffer throws when size is exceeded with a dataView', checkMaxBuffer, longDataView, fixtureDataView, fixtureLength);
test('maxBuffer unit is bytes with getStreamAsArrayBuffer()', checkMaxBuffer, longMultibyteUint16Array, fixtureMultibyteUint16Array, fixtureMultibyteUint16Array.byteLength);

test('handles streams larger than arrayBuffer max length', async t => {
	t.timeout(BIG_TEST_DURATION);
	const chunkCount = Math.floor(BufferConstants.MAX_LENGTH / CHUNK_SIZE * 2);
	const chunk = Buffer.alloc(CHUNK_SIZE);
	const maxBufferChunks = Array.from({length: chunkCount}, () => chunk);
	const {bufferedData} = await t.throwsAsync(setupArrayBuffer(maxBufferChunks));
	t.is(new Uint8Array(bufferedData)[0], 0);
});

const CHUNK_SIZE = 2 ** 16;

test('getStreamAsArrayBuffer() behaves like arrayBuffer()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		arrayBuffer(createStream([bigArrayBuffer])),
		setupArrayBuffer([bigArrayBuffer]),
	]);
	t.deepEqual(nativeResult, customResult);
});

test('getStreamAsArrayBuffer() can behave like blob()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		blob(createStream([bigArrayBuffer])),
		setupArrayBuffer([bigArrayBuffer]),
	]);
	t.deepEqual(nativeResult, new Blob([customResult]));
});
