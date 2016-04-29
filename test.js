import fs from 'fs';
import test from 'ava';
import bufferEquals from 'buffer-equals';
import intoStream from 'into-stream';
import m from './';

test('get stream as a string', async t => {
	t.is(await m(fs.createReadStream('fixture')), 'unicorn\n');
	t.is(await m(fs.createReadStream('fixture'), {encoding: 'hex'}), '756e69636f726e0a');
});

test('get stream as a buffer', async t => {
	t.true(
		bufferEquals(await m.buffer(fs.createReadStream('fixture')),
		new Buffer('unicorn\n'))
	);
});

test('get stream as an array', async t => {
	const fixture = fs.createReadStream('index.js', 'utf8');
	fixture.setEncoding('utf8');
	t.is(typeof (await m.array(fixture))[0], 'string');
});

test('get object stream as an array', async t => {
	const fixture = [{foo: true}, {bar: false}];
	t.deepEqual(await m.array(intoStream.obj(fixture)), fixture);
});

test('getStream should not affect additional listeners attached to the stream', async t => {
	t.plan(3);
	const fixture = intoStream(['foo', 'bar']);

	fixture.on('data', chunk => t.true(Buffer.isBuffer(chunk)));

	t.is(await m(fixture), 'foobar');
});
