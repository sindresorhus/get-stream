import fs from 'fs';
import test from 'ava';
import bufferEquals from 'buffer-equals';
import intoStream from 'into-stream';
import m from './';

function setup(streamDef, opts) {
	return m(intoStream(streamDef), opts);
}

setup.array = function setup(streamDef, opts) {
	return m.array(intoStream(streamDef), opts);
};

setup.buffer = function setup(streamDef, opts) {
	return m.buffer(intoStream(streamDef), opts);
};

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

test('get non-object stream as an array of strings', async t => {
	const stream = intoStream(['foo', 'bar']);

	const result = await m.array(stream, {encoding: 'utf8'});

	t.deepEqual(result, ['foo', 'bar']);
});

test('get non-object stream as an array of Buffers', async t => {
	const stream = intoStream(['foo', 'bar']);

	const result = await m.array(stream, {encoding: 'buffer'});

	t.deepEqual(result, [new Buffer('foo'), new Buffer('bar')]);
});

test('getStream should not affect additional listeners attached to the stream', async t => {
	t.plan(3);
	const fixture = intoStream(['foo', 'bar']);

	fixture.on('data', chunk => t.true(Buffer.isBuffer(chunk)));

	t.is(await m(fixture), 'foobar');
});

test('maxBuffer throws when size is exceeded', t => {
	t.throws(setup(['abcd'], {maxBuffer: 3}));
	t.notThrows(setup(['abc'], {maxBuffer: 3}));

	t.throws(setup.buffer(['abcd'], {maxBuffer: 3}));
	t.notThrows(setup.buffer(['abc'], {maxBuffer: 3}));
});

test('maxBuffer applies to length of arrays when in objectMode', t => {
	t.throws(m.array(intoStream.obj([{a: 1}, {b: 2}, {c: 3}, {d: 4}]), {maxBuffer: 3}));
	t.notThrows(m.array(intoStream.obj([{a: 1}, {b: 2}, {c: 3}]), {maxBuffer: 3}));
});

test('maxBuffer applies to length of data when not in objectMode', t => {
	t.throws(setup.array(['ab', 'cd', 'ef'], {encoding: 'utf8', maxBuffer: 5}));
	t.notThrows(setup.array(['ab', 'cd', 'ef'], {encoding: 'utf8', maxBuffer: 6}));
	t.throws(setup.array(['ab', 'cd', 'ef'], {encoding: 'buffer', maxBuffer: 5}));
	t.notThrows(setup.array(['ab', 'cd', 'ef'], {encoding: 'buffer', maxBuffer: 6}));
});
