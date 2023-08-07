import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {Buffer} from 'node:buffer';
import {setTimeout} from 'node:timers/promises';
import {compose} from 'node:stream';
import {text, buffer} from 'node:stream/consumers';
import test from 'ava';
import getStream, {getStreamAsBuffer, MaxBufferError} from './index.js';

const fixtureString = await readFile('fixture', 'utf8');
const fixtureBuffer = Buffer.from(fixtureString);
const fixtureHex = fixtureBuffer.toString('hex');

const shortString = 'abc';
const longString = `${shortString}d`;
const maxBuffer = shortString.length;

const setup = (streamDef, options) => getStream(compose(streamDef), options);
const setupBuffer = (streamDef, options) => getStreamAsBuffer(compose(streamDef), options);

test('get stream', async t => {
	const result = await getStream(fs.createReadStream('fixture'));
	t.is(result, fixtureString);
});

test('get stream as a buffer', async t => {
	const result = await getStreamAsBuffer(fs.createReadStream('fixture'));
	t.true(result.equals(fixtureBuffer));
});

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

test('`encoding` option sets the encoding', async t => {
	const result = await getStream(fs.createReadStream('fixture'), {encoding: 'hex'});
	t.is(result, fixtureHex);
});

test('native string', async t => {
	const result = await text(fs.createReadStream('fixture', {encoding: 'utf8'}));
	t.is(result, fixtureString);
});

test('native buffer', async t => {
	const result = await buffer(fs.createReadStream('fixture', {encoding: 'utf8'}));
	t.true(result.equals(fixtureBuffer));
});
