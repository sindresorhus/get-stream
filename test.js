import {Buffer, constants as BufferConstants} from 'node:buffer';
import {setTimeout} from 'node:timers/promises';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {version as nodeVersion} from 'node:process';
import {Duplex} from 'node:stream';
import {text, buffer} from 'node:stream/consumers';
import test from 'ava';
import getStream, {getStreamAsBuffer, MaxBufferError} from './index.js';

const fixtureString = 'unicorn\n';
const fixtureBuffer = Buffer.from(fixtureString);
const fixtureTypedArray = new TextEncoder().encode(fixtureString);
const fixtureArrayBuffer = fixtureTypedArray.buffer;
const fixtureUint16Array = new Uint16Array(fixtureArrayBuffer);
const fixtureDataView = new DataView(fixtureArrayBuffer);

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
const maxBuffer = fixtureString.length;

const setup = (streamDef, options) => getStream(createStream(streamDef), options);
const setupBuffer = (streamDef, options) => getStreamAsBuffer(createStream(streamDef), options);

const createStream = streamDef => {
	const generator = typeof streamDef === 'function' ? streamDef : function * () {
		yield * streamDef;
	};

	return Duplex.from(generator);
};

const getStreamToString = async (t, inputStream) => {
	const result = await setup([inputStream]);
	t.is(typeof result, 'string');
	t.is(result, fixtureString);
};

test('get stream from string to string', getStreamToString, fixtureString);
test('get stream from buffer to string', getStreamToString, fixtureBuffer);
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
test('get stream from typedArray to buffer', getStreamToBuffer, fixtureTypedArray);
test('get stream from typedArray with offset to buffer', getStreamToBuffer, fixtureTypedArrayWithOffset);
test('get stream from uint16Array to buffer', getStreamToBuffer, fixtureUint16Array);
test('get stream from uint16Array with offset to buffer', getStreamToBuffer, fixtureUint16ArrayWithOffset);
test('get stream from dataView to buffer', getStreamToBuffer, fixtureDataView);
test('get stream from dataView with offset to buffer', getStreamToBuffer, fixtureDataViewWithOffset);

const throwOnInvalidChunkType = async (t, setupFunction, inputStream) => {
	await t.throwsAsync(setupFunction([inputStream]), {message: /not supported/});
};

test('get stream from object to string', throwOnInvalidChunkType, setup, {});
test('get stream from object to buffer', throwOnInvalidChunkType, setupBuffer, {});
test('get stream from array to string', throwOnInvalidChunkType, setup, []);
test('get stream from array to buffer', throwOnInvalidChunkType, setupBuffer, []);
test('get stream from boolean to string', throwOnInvalidChunkType, setup, false);
test('get stream from boolean to buffer', throwOnInvalidChunkType, setupBuffer, false);
test('get stream from number to string', throwOnInvalidChunkType, setup, 0);
test('get stream from number to buffer', throwOnInvalidChunkType, setupBuffer, 0);
test('get stream from bigint to string', throwOnInvalidChunkType, setup, 0n);
test('get stream from bigint to buffer', throwOnInvalidChunkType, setupBuffer, 0n);
test('get stream from undefined to string', throwOnInvalidChunkType, setup, undefined);
test('get stream from undefined to buffer', throwOnInvalidChunkType, setupBuffer, undefined);
test('get stream from symbol to string', throwOnInvalidChunkType, setup, Symbol('test'));
test('get stream from symbol to buffer', throwOnInvalidChunkType, setupBuffer, Symbol('test'));

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

const checkMaxBuffer = async (t, setupFunction, longValue, shortValue) => {
	await t.throwsAsync(setupFunction([longValue], {maxBuffer}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setupFunction([shortValue], {maxBuffer}));
};

test('maxBuffer throws when size is exceeded with a string', checkMaxBuffer, setup, longString, fixtureString);
test('maxBuffer throws when size is exceeded with a buffer', checkMaxBuffer, setupBuffer, longBuffer, fixtureBuffer);
test('maxBuffer throws when size is exceeded with a typedArray', checkMaxBuffer, setupBuffer, longTypedArray, fixtureTypedArray);
test('maxBuffer throws when size is exceeded with an uint16Array', checkMaxBuffer, setupBuffer, longUint16Array, fixtureUint16Array);
test('maxBuffer throws when size is exceeded with a dataView', checkMaxBuffer, setupBuffer, longDataView, fixtureDataView);

test('set error.bufferedData when `maxBuffer` is hit', async t => {
	const error = await t.throwsAsync(setup([longString], {maxBuffer}), {instanceOf: MaxBufferError});
	t.is(error.bufferedData, longString);
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

test.serial('handles streams larger than buffer max length', async t => {
	t.timeout(BIG_TEST_DURATION);
	const chunkSize = 2 ** 16;
	const chunkCount = Math.floor(BufferConstants.MAX_LENGTH / chunkSize * 2);
	const chunk = Buffer.alloc(chunkSize);
	const chunks = Array.from({length: chunkCount}, () => chunk);
	const {bufferedData} = await t.throwsAsync(setupBuffer(chunks));
	t.is(bufferedData[0], 0);
});

test.serial('handles streams larger than string max length', async t => {
	t.timeout(BIG_TEST_DURATION);
	const chunkSize = 2 ** 16;
	const chunkCount = Math.floor(BufferConstants.MAX_STRING_LENGTH / chunkSize * 2);
	const chunk = '.'.repeat(chunkSize);
	const chunks = Array.from({length: chunkCount}, () => chunk);
	const {bufferedData} = await t.throwsAsync(setup(chunks));
	t.is(bufferedData[0], '.');
});

// Tests related to big buffers/strings can be slow. We run them serially and
// with a higher timeout to ensure they do not randomly fail
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

test('native string', async t => {
	const result = await text(createStream(fixtureString));
	t.is(result, fixtureString);
});

test('native buffer', async t => {
	const result = await buffer(createStream(fixtureString));
	t.true(result.equals(fixtureBuffer));
});
