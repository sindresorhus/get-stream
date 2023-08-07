import fs from 'node:fs';
import {Buffer} from 'node:buffer';
import {text, buffer} from 'node:stream/consumers';
import test from 'ava';
import intoStream from 'into-stream';
import getStream, {getStreamAsBuffer, MaxBufferError} from './index.js';

function makeSetup(intoStream) {
	const setup = (streamDef, options) => getStream(intoStream(streamDef), options);
	setup.buffer = (streamDef, options) => getStreamAsBuffer(intoStream(streamDef), options);
	return setup;
}

const setup = makeSetup(intoStream);
setup.object = makeSetup(intoStream.object);

test('get stream', async t => {
	const result = await getStream(fs.createReadStream('fixture'));
	t.is(result, 'unicorn\n');
});

test('get stream as a buffer', async t => {
	const result = await getStreamAsBuffer(fs.createReadStream('fixture'));
	t.true(result.equals(Buffer.from('unicorn\n')));
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

test('native string', async t => {
	const result = await text(fs.createReadStream('fixture', {encoding: 'utf8'}));
	t.is(result, 'unicorn\n');
});

test('native buffer', async t => {
	const result = await buffer(fs.createReadStream('fixture', {encoding: 'utf8'}));
	t.true(result.equals(Buffer.from('unicorn\n')));
});
