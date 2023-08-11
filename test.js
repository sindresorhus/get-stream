import {Buffer, constants as BufferConstants, Blob} from 'node:buffer';
import {setTimeout} from 'node:timers/promises';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {open} from 'node:fs/promises';
import {version as nodeVersion} from 'node:process';
import {Duplex} from 'node:stream';
import {text, buffer, arrayBuffer, blob} from 'node:stream/consumers';
import test from 'ava';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer, getStreamAsArray, MaxBufferError} from './index.js';

const fixtureString = 'unicorn\n';
const fixtureBuffer = Buffer.from(fixtureString);
const fixtureTypedArray = new TextEncoder().encode(fixtureString);
const fixtureArrayBuffer = fixtureTypedArray.buffer;
const fixtureUint16Array = new Uint16Array(fixtureArrayBuffer);
const fixtureDataView = new DataView(fixtureArrayBuffer);
const fixtureUtf16 = Buffer.from(fixtureString, 'utf-16le');
const fixtureMultibyteString = '\u1000';
const fixtureMultibyteBuffer = Buffer.from(fixtureMultibyteString);
const fixtureMultibyteUint16Array = new Uint16Array([0, 0]);
const fixtureArray = [{}];

const fixtureMultiString = [...fixtureString];
const fixtureMultiBytes = [...fixtureBuffer];
const fixtureMultiBuffer = fixtureMultiBytes.map(byte => Buffer.from([byte]));
const fixtureMultiTypedArray = fixtureMultiBytes.map(byte => new Uint8Array([byte]));
const fixtureMultiArrayBuffer = fixtureMultiTypedArray.map(({buffer}) => buffer);
const fixtureMultiUint16Array = Array.from({length: fixtureMultiBytes.length / 2}, (_, index) =>
	new Uint16Array([((2 ** 8) * fixtureMultiBytes[(index * 2) + 1]) + fixtureMultiBytes[index * 2]]),
);
const fixtureMultiDataView = fixtureMultiArrayBuffer.map(arrayBuffer => new DataView(arrayBuffer));

const fixtureStringWide = `  ${fixtureString}  `;
const fixtureTypedArrayWide = new TextEncoder().encode(fixtureStringWide);
const fixtureArrayBufferWide = fixtureTypedArrayWide.buffer;
const fixtureTypedArrayWithOffset = new Uint8Array(fixtureArrayBufferWide, 2, fixtureString.length);
const fixtureUint16ArrayWithOffset = new Uint16Array(fixtureArrayBufferWide, 2, fixtureString.length / 2);
const fixtureDataViewWithOffset = new DataView(fixtureArrayBufferWide, 2, fixtureString.length);

const longString = `${fixtureString}..`;
const longBuffer = Buffer.from(longString);
const longTypedArray = new TextEncoder().encode(longString);
const longArrayBuffer = longTypedArray.buffer;
const longUint16Array = new Uint16Array(longArrayBuffer);
const longDataView = new DataView(longArrayBuffer);
const fixtureLength = fixtureString.length;
const longMultibyteString = `${fixtureMultibyteString}\u1000`;
const longMultibyteBuffer = Buffer.from(longMultibyteString);
const longMultibyteUint16Array = new Uint16Array([0, 0, 0]);
const longArray = [...fixtureArray, {}];

const bigArray = Array.from({length: 1e6}, () => Math.floor(Math.random() * (2 ** 8)));
const bigBuffer = Buffer.from(bigArray);
const bigString = bigBuffer.toString();
const bigArrayBuffer = bigBuffer.buffer;

const TEST_URL = 'https://nodejs.org/dist/index.json';

const setup = (streamDef, options) => getStream(createStream(streamDef), options);
const setupBuffer = (streamDef, options) => getStreamAsBuffer(createStream(streamDef), options);
const setupArrayBuffer = (streamDef, options) => getStreamAsArrayBuffer(createStream(streamDef), options);
const setupArray = (streamDef, options) => getStreamAsArray(createStream(streamDef), options);

const createStream = streamDef => {
	const generator = typeof streamDef === 'function' ? streamDef : function * () {
		yield * streamDef;
	};

	return Duplex.from(generator);
};

const createReadableStream = streamDef => Duplex.toWeb(Duplex.from(streamDef)).readable;

const getStreamToString = async (t, fixtureValue) => {
	const result = await setup(fixtureValue);
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

const throwOnInvalidChunkType = async (t, setupFunction, fixtureValue) => {
	await t.throwsAsync(setupFunction([fixtureValue]), {message: /not supported/});
};

const allowsAnyChunkType = async (t, setupFunction, fixtureValue) => {
	await t.notThrowsAsync(setupFunction([fixtureValue]));
};

test('get stream from object to string', throwOnInvalidChunkType, setup, {});
test('get stream from object to buffer', throwOnInvalidChunkType, setupBuffer, {});
test('get stream from object to arrayBuffer', throwOnInvalidChunkType, setupArrayBuffer, {});
test('get stream from object to array', allowsAnyChunkType, setupArray, {});
test('get stream from array to string', throwOnInvalidChunkType, setup, []);
test('get stream from array to buffer', throwOnInvalidChunkType, setupBuffer, []);
test('get stream from array to arrayBuffer', throwOnInvalidChunkType, setupArrayBuffer, []);
test('get stream from array to array', allowsAnyChunkType, setupArray, []);
test('get stream from boolean to string', throwOnInvalidChunkType, setup, false);
test('get stream from boolean to buffer', throwOnInvalidChunkType, setupBuffer, false);
test('get stream from boolean to arrayBuffer', throwOnInvalidChunkType, setupArrayBuffer, false);
test('get stream from boolean to array', allowsAnyChunkType, setupArray, false);
test('get stream from number to string', throwOnInvalidChunkType, setup, 0);
test('get stream from number to buffer', throwOnInvalidChunkType, setupBuffer, 0);
test('get stream from number to arrayBuffer', throwOnInvalidChunkType, setupArrayBuffer, 0);
test('get stream from number to array', allowsAnyChunkType, setupArray, 0);
test('get stream from bigint to string', throwOnInvalidChunkType, setup, 0n);
test('get stream from bigint to buffer', throwOnInvalidChunkType, setupBuffer, 0n);
test('get stream from bigint to arrayBuffer', throwOnInvalidChunkType, setupArrayBuffer, 0n);
test('get stream from bigint to array', allowsAnyChunkType, setupArray, 0n);
test('get stream from undefined to string', throwOnInvalidChunkType, setup, undefined);
test('get stream from undefined to buffer', throwOnInvalidChunkType, setupBuffer, undefined);
test('get stream from undefined to arrayBuffer', throwOnInvalidChunkType, setupArrayBuffer, undefined);
test('get stream from undefined to array', allowsAnyChunkType, setupArray, undefined);
test('get stream from symbol to string', throwOnInvalidChunkType, setup, Symbol('test'));
test('get stream from symbol to buffer', throwOnInvalidChunkType, setupBuffer, Symbol('test'));
test('get stream from symbol to arrayBuffer', throwOnInvalidChunkType, setupArrayBuffer, Symbol('test'));
test('get stream from symbol to array', allowsAnyChunkType, setupArray, Symbol('test'));

test('get stream with mixed chunk types', async t => {
	const result = await setup([fixtureString, fixtureBuffer, fixtureArrayBuffer, fixtureTypedArray, fixtureUint16Array, fixtureDataView]);
	t.is(result, fixtureString.repeat(6));
});

const multiByteString = 'a\u1000';
const multiByteUint8Array = new TextEncoder().encode(multiByteString);
const multiByteBuffer = [...multiByteUint8Array].map(byte => Buffer.from([byte]));
const INVALID_UTF8_MARKER = '\uFFFD';

test('get stream with partial UTF-8 sequences', async t => {
	const result = await setup(multiByteBuffer);
	t.is(result, multiByteString);
});

test('get stream with truncated UTF-8 sequences', async t => {
	const result = await setup(multiByteBuffer.slice(0, -1));
	t.is(result, `${multiByteString.slice(0, -1)}${INVALID_UTF8_MARKER}`);
});

test('get stream with invalid UTF-8 sequences', async t => {
	const result = await setup(multiByteBuffer.slice(1, 2));
	t.is(result, INVALID_UTF8_MARKER);
});

test('getStream should not affect additional listeners attached to the stream', async t => {
	t.plan(3);
	const fixture = createStream(['foo', 'bar']);
	fixture.on('data', chunk => t.true(typeof chunk === 'string'));
	t.is(await getStream(fixture), 'foobar');
});

// eslint-disable-next-line max-params
const checkMaxBuffer = async (t, setupFunction, longValue, shortValue, maxBuffer) => {
	await t.throwsAsync(setupFunction(longValue, {maxBuffer}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setupFunction(shortValue, {maxBuffer}));
};

test('maxBuffer throws when size is exceeded with a string', checkMaxBuffer, setup, [longString], [fixtureString], fixtureLength);
test('maxBuffer throws when size is exceeded with a buffer', checkMaxBuffer, setupBuffer, [longBuffer], [fixtureBuffer], fixtureLength);
test('maxBuffer throws when size is exceeded with an arrayBuffer', checkMaxBuffer, setupArrayBuffer, [longArrayBuffer], [fixtureArrayBuffer], fixtureLength);
test('maxBuffer throws when size is exceeded with a typedArray', checkMaxBuffer, setupArrayBuffer, [longTypedArray], [fixtureTypedArray], fixtureLength);
test('maxBuffer throws when size is exceeded with an uint16Array', checkMaxBuffer, setupArrayBuffer, [longUint16Array], [fixtureUint16Array], fixtureLength);
test('maxBuffer throws when size is exceeded with a dataView', checkMaxBuffer, setupArrayBuffer, [longDataView], [fixtureDataView], fixtureLength);

test('maxBuffer unit is characters with getStream()', checkMaxBuffer, setup, [longMultibyteString], [fixtureMultibyteString], fixtureMultibyteString.length);
test('maxBuffer unit is bytes with getStreamAsBuffer()', checkMaxBuffer, setupBuffer, [longMultibyteBuffer], [fixtureMultibyteBuffer], fixtureMultibyteBuffer.byteLength);
test('maxBuffer unit is bytes with getStreamAsArrayBuffer()', checkMaxBuffer, setupArrayBuffer, [longMultibyteUint16Array], [fixtureMultibyteUint16Array], fixtureMultibyteUint16Array.byteLength);
test('maxBuffer unit is each array element with getStreamAsArray()', checkMaxBuffer, setupArray, longArray, fixtureArray, fixtureArray.length);

test('set error.bufferedData when `maxBuffer` is hit', async t => {
	const maxBuffer = fixtureLength - 1;
	const {bufferedData} = await t.throwsAsync(setupBuffer([...fixtureString], {maxBuffer}), {instanceOf: MaxBufferError});
	t.true(fixtureString.startsWith(bufferedData.toString()));
	t.true(bufferedData.length <= maxBuffer);
});

const errorStream = async function * () {
	yield fixtureString;
	await setTimeout(0);
	throw new Error('test');
};

test('set error.bufferedData when stream errors', async t => {
	const error = await t.throwsAsync(setup(errorStream));
	t.is(error.bufferedData, fixtureString);
});

const infiniteIteration = async function * () {
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		await setTimeout(0);
		yield '.';
	}
};

test('handles infinite stream', async t => {
	await t.throwsAsync(setup(infiniteIteration, {maxBuffer: 1}), {instanceOf: MaxBufferError});
});

const getMaxBufferChunks = () => {
	const chunkSize = 2 ** 16;
	const chunkCount = Math.floor(BufferConstants.MAX_LENGTH / chunkSize * 2);
	const chunk = Buffer.alloc(chunkSize);
	return Array.from({length: chunkCount}, () => chunk);
};

const getMaxStringChunks = () => {
	const chunkSize = 2 ** 16;
	const chunkCount = Math.floor(BufferConstants.MAX_STRING_LENGTH / chunkSize * 2);
	const chunk = '.'.repeat(chunkSize);
	return Array.from({length: chunkCount}, () => chunk);
};

const maxBufferChunks = getMaxBufferChunks();
const maxStringChunks = getMaxStringChunks();

test.serial('handles streams larger than arrayBuffer max length', async t => {
	t.timeout(BIG_TEST_DURATION);
	const {bufferedData} = await t.throwsAsync(setupArrayBuffer(maxBufferChunks));
	t.is(new Uint8Array(bufferedData)[0], 0);
});

test.serial('handles streams larger than buffer max length', async t => {
	t.timeout(BIG_TEST_DURATION);
	const {bufferedData} = await t.throwsAsync(setupBuffer(maxBufferChunks));
	t.is(bufferedData[0], 0);
});

test.serial('handles streams larger than string max length', async t => {
	t.timeout(BIG_TEST_DURATION);
	const {bufferedData} = await t.throwsAsync(setup(maxStringChunks));
	t.is(bufferedData[0], '.');
});

// Tests related to big buffers/strings can be slow. We run them serially and
// with a higher timeout to ensure they do not randomly fail.
const BIG_TEST_DURATION = '2m';

test('handles streams with a single chunk larger than string max length', async t => {
	const chunks = [Buffer.alloc(BufferConstants.MAX_STRING_LENGTH + 1)];
	const {bufferedData} = await t.throwsAsync(setup(chunks));
	t.is(bufferedData, '');
});

const firstArgumentCheck = async (t, firstArgument) => {
	await t.throwsAsync(getStream(firstArgument), {message: /first argument/});
};

test('Throws if the first argument is undefined', firstArgumentCheck, undefined);
test('Throws if the first argument is null', firstArgumentCheck, null);
test('Throws if the first argument is a string', firstArgumentCheck, '');
test('Throws if the first argument is an array', firstArgumentCheck, []);

test('works with createReadStream() and buffers', async t => {
	const result = await getStreamAsBuffer(createReadStream('fixture'));
	t.true(result.equals(fixtureBuffer));
});

test('works with createReadStream() and utf8', async t => {
	const result = await getStream(createReadStream('fixture', 'utf8'));
	t.is(result, fixtureString);
});

test('works with child_process.spawn()', async t => {
	const {stdout} = spawn('node', ['--version'], {stdio: ['ignore', 'pipe', 'ignore']});
	const result = await getStream(stdout);
	t.is(result.trim(), nodeVersion);
});

// @todo: remove this condition after dropping support for Node 16.
// `ReadableStream` was added in Node 16.5.0.
// `Duplex.toWeb()` and `fileHandle.readableWebStream` were added in Node 17.0.0.
// `fetch()` without an experimental flag was added in Node 18.0.0.
// However, `get-stream`'s implementation does not refer to any of those
// variables and functions. Instead, it only supports specific chunk types
// (`TypedArray`, `DataView`, `ArrayBuffer`) for any async iterable.
// Doing so automatically works with `ReadableStream`s, regardless of whether
// the environment supports them.
if (!nodeVersion.startsWith('v16.')) {
	test('works with ReadableStream', async t => {
		const result = await getStream(createReadableStream(fixtureString));
		t.is(result, fixtureString);
	});

	const readableWebStream = async (t, type) => {
		const fileHandle = await open('fixture');

		try {
			const result = await getStream(fileHandle.readableWebStream({type}));
			t.is(result, fixtureString);
		} finally {
			await fileHandle.close();
		}
	};

	test('works with readableWebStream({ type: undefined })', readableWebStream, undefined);
	test('works with readableWebStream({ type: "bytes" })', readableWebStream, 'bytes');

	test('works with fetch()', async t => {
		const {body} = await fetch(TEST_URL);
		const result = await getStream(body);
		const parsedResult = JSON.parse(result);
		t.true(Array.isArray(parsedResult));
	});

	test('can use TextDecoderStream', async t => {
		const textDecoderStream = new TextDecoderStream('utf-16le');
		const result = await getStream(
			createReadableStream(fixtureUtf16).pipeThrough(textDecoderStream),
		);
		t.is(result, fixtureString);
	});
}

// The following tests take lots of memory, which can make the process crash
// without `test.serial()`
test.serial('getStream() behaves like text()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		text(createStream([bigString])),
		setup([bigString]),
	]);
	t.is(nativeResult, customResult);
});

test.serial('getStreamAsBuffer() behaves like buffer()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		buffer(createStream([bigBuffer])),
		setupBuffer([bigBuffer]),
	]);
	t.deepEqual(nativeResult, customResult);
});

test.serial('getStreamAsArrayBuffer() behaves like arrayBuffer()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		arrayBuffer(createStream([bigArrayBuffer])),
		setupArrayBuffer([bigArrayBuffer]),
	]);
	t.deepEqual(nativeResult, customResult);
});

test.serial('getStreamAsArrayBuffer() can behave like blob()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		blob(createStream([bigArrayBuffer])),
		setupArrayBuffer([bigArrayBuffer]),
	]);
	t.deepEqual(nativeResult, new Blob([customResult]));
});

test.serial('getStreamAsArray() behaves like readable.toArray()', async t => {
	const [nativeResult, customResult] = await Promise.all([
		createStream([bigArray]).toArray(),
		setupArray([bigArray]),
	]);
	t.deepEqual(nativeResult, customResult);
});
