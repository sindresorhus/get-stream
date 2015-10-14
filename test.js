import fs from 'fs';
import test from 'ava';
import bufferEquals from 'buffer-equals';
import fn from './';

test('get stream as a string', async t => {
	t.is(await fn(fs.createReadStream('fixture')), 'unicorn\n');
});

test('get stream as a buffer', async t => {
	t.true(
		bufferEquals(await fn.buffer(fs.createReadStream('fixture')),
		new Buffer('unicorn\n'))
	);
});
