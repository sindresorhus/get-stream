import {Buffer} from 'node:buffer';
import {setTimeout} from 'node:timers/promises';
import {compose} from 'node:stream';
import {text, buffer} from 'node:stream/consumers';
import test from 'ava';
import getStream, {getStreamAsBuffer, MaxBufferError} from './index.js';

const fixtureString = 'unicorn\n';
const fixtureBuffer = Buffer.from(fixtureString);
const fixtureHex = fixtureBuffer.toString('hex');
const fixtureBase64Url = fixtureBuffer.toString('base64url');

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

const getStreamToHex = async (t, inputStream) => {
	const result = await setup(inputStream, {encoding: 'hex'});
	t.is(result, fixtureHex);
};

const getStreamToBase64Url = async (t, inputStream) => {
	const result = await setup(inputStream, {encoding: 'base64Url'});
	t.is(result, fixtureBase64Url);
};

test('get stream from buffer to utf8', getStreamToUtf8, fixtureBuffer);
test('get stream from buffer to buffer', getStreamToBuffer, fixtureBuffer);
test('get stream from buffer to hex', getStreamToHex, fixtureBuffer);
test('get stream from buffer to base64url', getStreamToBase64Url, fixtureBuffer);
test('get stream from utf8 to utf8', getStreamToUtf8, fixtureString);
test('get stream from utf8 to buffer', getStreamToBuffer, fixtureString);
test('get stream from utf8 to hex', getStreamToHex, fixtureString);
test('get stream from utf8 to base64url', getStreamToBase64Url, fixtureString);

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

test('native string', async t => {
	const result = await text(compose(fixtureString));
	t.is(result, fixtureString);
});

test('native buffer', async t => {
	const result = await buffer(compose(fixtureString));
	t.true(result.equals(fixtureBuffer));
});
