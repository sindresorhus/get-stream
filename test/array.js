import {compose} from 'node:stream';
import test from 'ava';
import streamJson from 'stream-json';
import streamJsonArray from 'stream-json/streamers/StreamArray.js';
import {getStreamAsArray, MaxBufferError} from '../source/index.js';
import {createStream, BIG_TEST_DURATION} from './helpers/index.js';
import {
	fixtureString,
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
	bigArray,
} from './fixtures/index.js';

const fixtureArray = [{}];
const longArray = [...fixtureArray, {}];

const setupArray = (streamDef, options) => getStreamAsArray(createStream(streamDef), options);

const getStreamToArray = async (t, fixtureValue) => {
	const result = await setupArray(fixtureValue);
	t.deepEqual(result, fixtureValue);
};

test('get stream from string to array, with a single chunk', getStreamToArray, [fixtureString]);
test('get stream from buffer to array, with a single chunk', getStreamToArray, [fixtureBuffer]);
test('get stream from arrayBuffer to array, with a single chunk', getStreamToArray, [fixtureArrayBuffer]);
test('get stream from typedArray to array, with a single chunk', getStreamToArray, [fixtureTypedArray]);
test('get stream from typedArray with offset to array, with a single chunk', getStreamToArray, [fixtureTypedArrayWithOffset]);
test('get stream from uint16Array to array, with a single chunk', getStreamToArray, [fixtureUint16Array]);
test('get stream from uint16Array with offset to array, with a single chunk', getStreamToArray, [fixtureUint16ArrayWithOffset]);
test('get stream from dataView to array, with a single chunk', getStreamToArray, [fixtureDataView]);
test('get stream from dataView with offset to array, with a single chunk', getStreamToArray, [fixtureDataViewWithOffset]);

test('get stream from string to array, with multiple chunks', getStreamToArray, fixtureMultiString);
test('get stream from buffer to array, with multiple chunks', getStreamToArray, fixtureMultiBuffer);
test('get stream from arrayBuffer to array, with multiple chunks', getStreamToArray, fixtureMultiArrayBuffer);
test('get stream from typedArray to array, with multiple chunks', getStreamToArray, fixtureMultiTypedArray);
test('get stream from uint16Array to array, with multiple chunks', getStreamToArray, fixtureMultiUint16Array);
test('get stream from dataView to array, with multiple chunks', getStreamToArray, fixtureMultiDataView);

const allowsAnyChunkType = async (t, fixtureValue) => {
	await t.notThrowsAsync(setupArray([fixtureValue]));
};

test('get stream from object to array', allowsAnyChunkType, {});
test('get stream from array to array', allowsAnyChunkType, []);
test('get stream from boolean to array', allowsAnyChunkType, false);
test('get stream from number to array', allowsAnyChunkType, 0);
test('get stream from bigint to array', allowsAnyChunkType, 0n);
test('get stream from undefined to array', allowsAnyChunkType, undefined);
test('get stream from symbol to array', allowsAnyChunkType, Symbol('test'));

test('maxBuffer unit is each array element with getStreamAsArray()', async t => {
	const maxBuffer = fixtureArray.length;
	await t.throwsAsync(setupArray(longArray, {maxBuffer}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setupArray(fixtureArray, {maxBuffer}));
});

test('getStreamAsArray() behaves like readable.toArray()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		createStream([bigArray]).toArray(),
		setupArray([bigArray]),
	]);
	t.deepEqual(nativeResult, customResult);
});

test('getStreamAsArray() can stream JSON', async t => {
	t.timeout(BIG_TEST_DURATION);
	const bigJson = bigArray.map(byte => ({byte}));
	const bigJsonString = JSON.stringify(bigJson);
	const result = await getStreamAsArray(compose(
		createStream([bigJsonString]),
		streamJson.parser(),
		streamJsonArray.streamArray(),
	));
	t.is(result.length, bigJson.length);
	t.deepEqual(result.at(-1).value, bigJson.at(-1));
});
