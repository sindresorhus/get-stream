import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {Buffer} from 'node:buffer';
import {setTimeout} from 'node:timers/promises';
import {compose} from 'node:stream';
import {text, buffer} from 'node:stream/consumers';
import test from 'ava';
import intoStream from 'into-stream';
import getStream, {getStreamAsBuffer, MaxBufferError} from './index.js';

const fixtureString = await readFile('fixture', 'utf8');
const fixtureBuffer = Buffer.from(fixtureString);
const fixtureHex = fixtureBuffer.toString('hex');

function makeSetup(intoStream) {
	const setup = (streamDef, options) => getStream(intoStream(streamDef), options);
	setup.buffer = (streamDef, options) => getStreamAsBuffer(intoStream(streamDef), options);
	return setup;
}

const setup = makeSetup(intoStream);
setup.object = makeSetup(intoStream.object);

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
	const fixture = intoStream(['foo', 'bar']);
	fixture.on('data', chunk => t.true(Buffer.isBuffer(chunk)));
	t.is(await getStream(fixture), 'foobar');
});

test('maxBuffer throws when size is exceeded', async t => {
	await t.throwsAsync(setup(['abcd'], {maxBuffer: 3}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setup(['abc'], {maxBuffer: 3}));
	await t.throwsAsync(setup.buffer(['abcd'], {maxBuffer: 3}), {instanceOf: MaxBufferError});
	await t.notThrowsAsync(setup.buffer(['abc'], {maxBuffer: 3}));
});

const infiniteIteration = async function * () {
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		await setTimeout(0);
		yield '.';
	}
};

test('handles infinite stream', async t => {
	const stream = compose(infiniteIteration());
	await t.throwsAsync(getStream(stream, {maxBuffer: 1}), {instanceOf: MaxBufferError});
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
