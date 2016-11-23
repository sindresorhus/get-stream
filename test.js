import fs from 'fs';
import {Readable} from 'stream';
import test from 'ava';
import intoStream from 'into-stream';
import m from './';

function makeSetup(intoStream) {
	const setup = (streamDef, opts) => m(intoStream(streamDef), opts);
	setup.array = (streamDef, opts) => m.array(intoStream(streamDef), opts);
	setup.buffer = (streamDef, opts) => m.buffer(intoStream(streamDef), opts);
	return setup;
}

const setup = makeSetup(intoStream);
setup.obj = makeSetup(intoStream.obj);

test('get stream as a buffer', async t => {
	t.true((await m.buffer(fs.createReadStream('fixture'))).equals(new Buffer('unicorn\n')));
});

test('get stream as an array', async t => {
	const fixture = fs.createReadStream('index.js', 'utf8');
	fixture.setEncoding('utf8');
	t.is(typeof (await m.array(fixture))[0], 'string');
});

test('get object stream as an array', async t => {
	const result = await setup.obj.array([{foo: true}, {bar: false}]);
	t.deepEqual(result, [{foo: true}, {bar: false}]);
});

test('get non-object stream as an array of strings', async t => {
	const result = await setup.array(['foo', 'bar'], {encoding: 'utf8'});
	t.deepEqual(result, ['foo', 'bar']);
});

test('get non-object stream as an array of Buffers', async t => {
	const result = await setup.array(['foo', 'bar'], {encoding: 'buffer'});
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
	t.throws(m.array(intoStream.obj([{a: 1}, {b: 2}, {c: 3}, {d: 4}]), {maxBuffer: 3}), /maxBuffer exceeded/);
	t.notThrows(m.array(intoStream.obj([{a: 1}, {b: 2}, {c: 3}]), {maxBuffer: 3}));
});

test('maxBuffer applies to length of data when not in objectMode', t => {
	t.throws(setup.array(['ab', 'cd', 'ef'], {encoding: 'utf8', maxBuffer: 5}), /maxBuffer exceeded/);
	t.notThrows(setup.array(['ab', 'cd', 'ef'], {encoding: 'utf8', maxBuffer: 6}));
	t.throws(setup.array(['ab', 'cd', 'ef'], {encoding: 'buffer', maxBuffer: 5}), /maxBuffer exceeded/);
	t.notThrows(setup.array(['ab', 'cd', 'ef'], {encoding: 'buffer', maxBuffer: 6}));
});

test('Promise rejects when input stream emits an error', async t => {
	const readable = new Readable();
	const data = 'invisible pink unicorn';
	const error = new Error('Made up error');
	const reads = data.match(/.{1,5}/g);

	readable._read = function () {
		if (reads.length === 0) {
			setImmediate(() => {
				this.emit('error', error);
			});
			return;
		}

		this.push(reads.shift());
	};

	try {
		await m(readable);
		t.fail('should throw');
	} catch (err) {
		t.is(err, error);
		t.is(err.bufferedData, data);
	}
});
