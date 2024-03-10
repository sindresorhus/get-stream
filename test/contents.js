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

const finallyGenerator = async function * (state) {
	try {
		yield {};
	} catch (error) {
		state.error = true;
		throw error;
	} finally {
		state.finally = true;
	}
};

test('async iterable .return() is called on error, but not .throw()', async t => {
	const state = {error: false, finally: false};
	await t.throwsAsync(getStream(finallyGenerator(state)));
	t.false(state.error);
	t.true(state.finally);
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

const errorStream = async function * () {
	yield fixtureString;
	await setTimeout(0);
	throw new Error('test');
};

test('set error.bufferedData when stream errors', async t => {
	const {bufferedData} = await t.throwsAsync(setupString(errorStream));
	t.is(bufferedData, fixtureString);
});

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
