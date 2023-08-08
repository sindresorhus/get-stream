import {Buffer, constants as BufferConstants} from 'node:buffer';
import {setTimeout} from 'node:timers/promises';
import {compose} from 'node:stream';
import {text, buffer} from 'node:stream/consumers';
import test from 'ava';
import getStream, {getStreamAsBuffer, MaxBufferError} from './index.js';

const fixtureString = 'unicorn\n';
const fixtureBuffer = Buffer.from(fixtureString);

const shortString = 'abc';
const longString = `${shortString}d`;
const maxBuffer = shortString.length;

const setup = (streamDef, options) => getStream(compose(streamDef), options);
const setupBuffer = (streamDef, options) => getStreamAsBuffer(compose(streamDef), options);

const getStreamToUtf8 = async (t, inputStream) => {
	const result = await setup(inputStream);
	t.is(result, fixtureString);
};

const getStreamToBuffer = async (t, inputStream) => {
	const result = await setupBuffer(inputStream);
	t.true(result.equals(fixtureBuffer));
};

test('get stream from buffer to utf8', getStreamToUtf8, fixtureBuffer);
test('get stream from buffer to buffer', getStreamToBuffer, fixtureBuffer);
test('get stream from utf8 to utf8', getStreamToUtf8, fixtureString);
test('get stream from utf8 to buffer', getStreamToBuffer, fixtureString);

test('getStream should not affect additional listeners attached to the stream', async t => {
	t.plan(3);
	const fixture = compose(['foo', 'bar']);
	fixture.on('data', chunk => t.true(typeof chunk === 'string'));
	t.is(await getStream(fixture), 'foobar');
});

test('maxBuffer throws when size is exceeded', async t => {
	await t.throwsAsync(setup([longString], {maxBuffer}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setup([shortString], {maxBuffer}));
	await t.throwsAsync(setupBuffer([longString], {maxBuffer}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setupBuffer([shortString], {maxBuffer}));
});

test('set error.bufferedData when `maxBuffer` is hit', async t => {
	const error = await t.throwsAsync(setup([longString], {maxBuffer}), {instanceOf: MaxBufferError});
	t.is(error.bufferedData, longString);
});

const errorStream = async function * () {
	yield shortString;
	await setTimeout(0);
	throw new Error('test');
};

test('set error.bufferedData when stream errors', async t => {
	const error = await t.throwsAsync(setup(errorStream()));
	t.is(error.bufferedData, shortString);
});

const infiniteIteration = async function * () {
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		await setTimeout(0);
		yield '.';
	}
};

test('handles infinite stream', async t => {
	await t.throwsAsync(setup(infiniteIteration(), {maxBuffer: 1}), {instanceOf: MaxBufferError});
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

test('native string', async t => {
	const result = await text(compose(fixtureString));
	t.is(result, fixtureString);
});

test('native buffer', async t => {
	const result = await buffer(compose(fixtureString));
	t.true(result.equals(fixtureBuffer));
});
