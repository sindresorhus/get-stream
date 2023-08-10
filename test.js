import {Buffer, constants as BufferConstants} from 'node:buffer';
import {setTimeout} from 'node:timers/promises';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {open} from 'node:fs/promises';
import {version as nodeVersion, env} from 'node:process';
import {Duplex} from 'node:stream';
import {text, buffer} from 'node:stream/consumers';
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

const getStreamToString = async (t, inputStream) => {
	const result = await setup([inputStream]);
	t.is(typeof result, 'string');
	t.is(result, fixtureString);
};

test('get stream from string to string', getStreamToString, fixtureString);
test('get stream from buffer to string', getStreamToString, fixtureBuffer);
test('get stream from arrayBuffer to string', getStreamToString, fixtureArrayBuffer);
test('get stream from typedArray to string', getStreamToString, fixtureTypedArray);
test('get stream from typedArray with offset to string', getStreamToString, fixtureTypedArrayWithOffset);
test('get stream from uint16Array to string', getStreamToString, fixtureUint16Array);
test('get stream from uint16Array with offset to string', getStreamToString, fixtureUint16ArrayWithOffset);
test('get stream from dataView to string', getStreamToString, fixtureDataView);
test('get stream from dataView with offset to string', getStreamToString, fixtureDataViewWithOffset);

const getStreamToBuffer = async (t, inputStream) => {
	const result = await setupBuffer([inputStream]);
	t.true(Buffer.isBuffer(result));
	t.true(result.equals(fixtureBuffer));
};

test('get stream from string to buffer', getStreamToBuffer, fixtureString);
test('get stream from buffer to buffer', getStreamToBuffer, fixtureBuffer);
test('get stream from arrayBuffer to buffer', getStreamToBuffer, fixtureArrayBuffer);
test('get stream from typedArray to buffer', getStreamToBuffer, fixtureTypedArray);
test('get stream from typedArray with offset to buffer', getStreamToBuffer, fixtureTypedArrayWithOffset);
test('get stream from uint16Array to buffer', getStreamToBuffer, fixtureUint16Array);
test('get stream from uint16Array with offset to buffer', getStreamToBuffer, fixtureUint16ArrayWithOffset);
test('get stream from dataView to buffer', getStreamToBuffer, fixtureDataView);
test('get stream from dataView with offset to buffer', getStreamToBuffer, fixtureDataViewWithOffset);

const getStreamToArrayBuffer = async (t, inputStream) => {
	const result = await setupArrayBuffer([inputStream]);
	t.true(result instanceof ArrayBuffer);
	t.true(Buffer.from(result).equals(fixtureBuffer));
};

test('get stream from string to arrayBuffer', getStreamToArrayBuffer, fixtureString);
test('get stream from buffer to arrayBuffer', getStreamToArrayBuffer, fixtureBuffer);
test('get stream from arrayBuffer to arrayBuffer', getStreamToArrayBuffer, fixtureArrayBuffer);
test('get stream from typedArray to arrayBuffer', getStreamToArrayBuffer, fixtureTypedArray);
test('get stream from typedArray with offset to arrayBuffer', getStreamToArrayBuffer, fixtureTypedArrayWithOffset);
test('get stream from uint16Array to arrayBuffer', getStreamToArrayBuffer, fixtureUint16Array);
test('get stream from uint16Array with offset to arrayBuffer', getStreamToArrayBuffer, fixtureUint16ArrayWithOffset);
test('get stream from dataView to arrayBuffer', getStreamToArrayBuffer, fixtureDataView);
test('get stream from dataView with offset to arrayBuffer', getStreamToArrayBuffer, fixtureDataViewWithOffset);

const getStreamToArray = async (t, fixtureValue) => {
	const result = await setupArray([fixtureValue]);
	t.true(Array.isArray(result));
	t.is(result.length, 1);
	t.is(result[0], fixtureValue);
};

test('get stream from string to array', getStreamToArray, fixtureString);
test('get stream from buffer to array', getStreamToArray, fixtureBuffer);
test('get stream from arrayBuffer to array', getStreamToArray, fixtureArrayBuffer);
test('get stream from typedArray to array', getStreamToArray, fixtureTypedArray);
test('get stream from typedArray with offset to array', getStreamToArray, fixtureTypedArrayWithOffset);
test('get stream from uint16Array to array', getStreamToArray, fixtureUint16Array);
test('get stream from uint16Array with offset to array', getStreamToArray, fixtureUint16ArrayWithOffset);
test('get stream from dataView to array', getStreamToArray, fixtureDataView);
test('get stream from dataView with offset to array', getStreamToArray, fixtureDataViewWithOffset);

const throwOnInvalidChunkType = async (t, setupFunction, inputStream) => {
	await t.throwsAsync(setupFunction([inputStream]), {message: /not supported/});
};

const allowsAnyChunkType = async (t, setupFunction, inputStream) => {
	await t.notThrowsAsync(setupFunction([inputStream]));
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

// Running this test works locally but makes `ava` process crash when run in
// GitHub actions. Unfortunately, the test requires building a very large
// `ArrayBuffer` in order to test how `get-stream` handles it, so there is no
// way around this but to keep the following test local-only.
if (!env.CI) {
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
}

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
		// @todo Remove the following comment when dropping support for Node 16
		// eslint-disable-next-line no-undef
		const textDecoderStream = new TextDecoderStream('utf-16le');
		const result = await getStream(
			createReadableStream(fixtureUtf16).pipeThrough(textDecoderStream),
		);
		t.is(result, fixtureString);
	});
}

test('native string', async t => {
	const result = await text(createStream(fixtureString));
	t.is(result, fixtureString);
});

test('native buffer', async t => {
	const result = await buffer(createStream(fixtureString));
	t.true(result.equals(fixtureBuffer));
});
