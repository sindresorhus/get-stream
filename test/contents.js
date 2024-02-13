import {setTimeout} from 'node:timers/promises';
import test from 'ava';
import getStream, {MaxBufferError} from '../source/index.js';
import {createStream} from './helpers/index.js';
import {
	fixtureString,
	fixtureBuffer,
	fixtureTypedArray,
	fixtureArrayBuffer,
	fixtureUint16Array,
	fixtureDataView,
} from './fixtures/index.js';

const setupString = (streamDef, options) => getStream(createStream(streamDef), options);

const generator = async function * () {
	yield 'a';
	await setTimeout(0);
	yield 'b';
};

test('works with async iterable', async t => {
	const result = await getStream(generator());
	t.is(result, 'ab');
});

test('get stream with mixed chunk types', async t => {
	const fixtures = [fixtureString, fixtureBuffer, fixtureArrayBuffer, fixtureTypedArray, fixtureUint16Array, fixtureDataView];
	const result = await setupString(fixtures);
	t.is(result, fixtureString.repeat(fixtures.length));
});

test('getStream should not affect additional listeners attached to the stream', async t => {
	t.plan(3);
	const fixture = createStream(['foo', 'bar']);
	fixture.on('data', chunk => t.true(typeof chunk === 'string'));
	t.is(await getStream(fixture), 'foobar');
});

const errorStream = async function * (error) {
	yield fixtureString;
	await setTimeout(0);
	throw error;
};

const testErrorStream = async (t, error) => {
	const {bufferedData} = await t.throwsAsync(setupString(errorStream.bind(undefined, error)));
	t.is(bufferedData, fixtureString);
};

test('set error.bufferedData when stream errors', testErrorStream, new Error('test'));
test('set error.bufferedData when stream error string', testErrorStream, 'test');
test('set error.bufferedData when stream error null', testErrorStream, null);
test('set error.bufferedData when stream error undefined', testErrorStream, undefined);

const infiniteIteration = async function * () {
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		await setTimeout(0);
		yield '.';
	}
};

test('handles infinite stream', async t => {
	await t.throwsAsync(setupString(infiniteIteration, {maxBuffer: 1}), {instanceOf: MaxBufferError});
});

const firstArgumentCheck = async (t, firstArgument) => {
	await t.throwsAsync(getStream(firstArgument), {message: /first argument/});
};

test('Throws if the first argument is undefined', firstArgumentCheck, undefined);
test('Throws if the first argument is null', firstArgumentCheck, null);
test('Throws if the first argument is a string', firstArgumentCheck, '');
test('Throws if the first argument is an array', firstArgumentCheck, []);
