import fs from 'fs';
import test from 'ava';
import bufferEquals from 'buffer-equals';
import intoStream from 'into-stream';
import fn from './';

test('get stream as a string', async t => {
	t.is(await fn(fs.createReadStream('fixture')), 'unicorn\n');
	t.is(await fn(fs.createReadStream('fixture'), {encoding: 'hex'}), '756e69636f726e0a');
});

test('get stream as a buffer', async t => {
	t.true(
		bufferEquals(await fn.buffer(fs.createReadStream('fixture')),
		new Buffer('unicorn\n'))
	);
});

test('get stream as an array', async t => {
	const fixture = fs.createReadStream('index.js', 'utf8');
	t.is(typeof (await fn.array(fixture))[0], 'string');
});

test('get object stream as an array', async t => {
	const fixture = [{foo: true}, {bar: false}];
	t.deepEqual(await fn.array(intoStream.obj(fixture)), fixture);
});
