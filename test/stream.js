import {once} from 'node:events';
import {version} from 'node:process';
import {Readable, Duplex} from 'node:stream';
import {scheduler, setTimeout as pSetTimeout} from 'node:timers/promises';
import test from 'ava';
import onetime from 'onetime';
import getStream, {getStreamAsArray, MaxBufferError} from '../source/index.js';
import {fixtureString, fixtureMultiString, prematureClose} from './fixtures/index.js';
import {onFinishedStream} from './helpers/index.js';

const noopMethods = {read() {}, write() {}};

// eslint-disable-next-line max-params
const assertStream = ({readableEnded = false, writableEnded = false}, t, stream, StreamClass, error = null) => {
	t.is(stream.errored, error);
	t.true(stream.destroyed);
	t.false(stream.readable);
	t.is(stream.readableEnded, readableEnded);

	if (StreamClass === Duplex) {
		t.false(stream.writable);
		t.is(stream.writableEnded, writableEnded);
	}
};

const assertSuccess = assertStream.bind(undefined, {readableEnded: true, writableEnded: true});
const assertReadFail = assertStream.bind(undefined, {writableEnded: true});
const assertWriteFail = assertStream.bind(undefined, {readableEnded: true});
const assertBothFail = assertStream.bind(undefined, {});

const testSuccess = async (t, StreamClass) => {
	const stream = StreamClass.from(fixtureMultiString);
	t.true(stream instanceof StreamClass);

	t.deepEqual(await getStreamAsArray(stream), fixtureMultiString);
	assertSuccess(t, stream, StreamClass);
};

test('Can use Readable stream', testSuccess, Readable);
test('Can use Duplex stream', testSuccess, Duplex);

const testAlreadyEnded = async (t, StreamClass) => {
	const stream = StreamClass.from(fixtureMultiString);
	await stream.toArray();
	assertSuccess(t, stream, StreamClass);

	t.deepEqual(await getStreamAsArray(stream), []);
};

test('Can use already ended Readable', testAlreadyEnded, Readable);
test('Can use already ended Duplex', testAlreadyEnded, Duplex);

const testAlreadyAborted = async (t, StreamClass) => {
	const stream = StreamClass.from(fixtureMultiString);
	stream.destroy();
	await t.throwsAsync(onFinishedStream(stream), prematureClose);
	assertReadFail(t, stream, StreamClass);

	const error = await t.throwsAsync(getStreamAsArray(stream), prematureClose);
	t.deepEqual(error.bufferedData, []);
};

test('Throw if already aborted Readable', testAlreadyAborted, Readable);
test('Throw if already aborted Duplex', testAlreadyAborted, Duplex);

const testAlreadyErrored = async (t, StreamClass) => {
	const stream = StreamClass.from(fixtureMultiString);
	const error = new Error('test');
	stream.destroy(error);
	t.is(await t.throwsAsync(onFinishedStream(stream)), error);
	assertReadFail(t, stream, StreamClass, error);

	t.is(await t.throwsAsync(getStreamAsArray(stream)), error);
	t.deepEqual(error.bufferedData, []);
};

test('Throw if already errored Readable', testAlreadyErrored, Readable);
test('Throw if already errored Duplex', testAlreadyErrored, Duplex);

const testAbort = async (t, StreamClass) => {
	const stream = new StreamClass(noopMethods);
	setTimeout(() => {
		stream.destroy();
	}, 0);
	const error = await t.throwsAsync(getStreamAsArray(stream), prematureClose);
	t.deepEqual(error.bufferedData, []);
	assertBothFail(t, stream, StreamClass);
};

test('Throw when aborting Readable', testAbort, Readable);
test('Throw when aborting Duplex', testAbort, Duplex);

const testError = async (t, StreamClass) => {
	const stream = new StreamClass(noopMethods);
	const error = new Error('test');
	setTimeout(() => {
		stream.destroy(error);
	}, 0);
	t.is(await t.throwsAsync(getStreamAsArray(stream)), error);
	t.deepEqual(error.bufferedData, []);
	assertBothFail(t, stream, StreamClass, error);
};

test('Throw when erroring Readable', testError, Readable);
test('Throw when erroring Duplex', testError, Duplex);

const testErrorEvent = async (t, StreamClass, hasCause) => {
	const stream = new StreamClass(noopMethods);
	const error = new Error('test', hasCause ? {cause: new Error('inner')} : {});
	setTimeout(() => {
		stream.emit('error', error);
	}, 0);
	t.is(await t.throwsAsync(getStreamAsArray(stream)), error);
	t.deepEqual(error.bufferedData, []);
	assertBothFail(t, stream, StreamClass);
};

test('Throw when emitting "error" event with Readable', testErrorEvent, Readable, false);
test('Throw when emitting "error" event with Duplex', testErrorEvent, Duplex, false);
test('Throw when emitting "error" event with Readable and error.cause', testErrorEvent, Readable, true);
test('Throw when emitting "error" event with Duplex and error.cause', testErrorEvent, Duplex, true);

const testThrowRead = async (t, StreamClass) => {
	const error = new Error('test');
	const stream = new StreamClass({
		read() {
			throw error;
		},
	});
	t.is(await t.throwsAsync(getStreamAsArray(stream)), error);
	t.deepEqual(error.bufferedData, []);
	assertBothFail(t, stream, StreamClass, error);
};

test('Throw when throwing error in Readable read()', testThrowRead, Readable);
test('Throw when throwing error in Duplex read()', testThrowRead, Duplex);

test('Throw when throwing error in Readable destroy()', async t => {
	const error = new Error('test');
	const stream = new Readable({
		read: onetime(function () {
			this.push(fixtureString);
			this.push(null);
		}),
		destroy(_, done) {
			done(error);
		},
	});

	t.is(await t.throwsAsync(getStream(stream)), error);
	t.deepEqual(error.bufferedData, fixtureString);
	assertSuccess(t, stream, Readable, error);
});

test('Throw when throwing error in Duplex final()', async t => {
	const error = new Error('test');
	const stream = new Duplex({
		read: onetime(function () {
			this.push(null);
		}),
		final(done) {
			done(error);
		},
	});
	stream.end();

	t.is(await t.throwsAsync(getStream(stream)), error);
	t.is(await t.throwsAsync(onFinishedStream(stream)), error);
	assertReadFail(t, stream, Duplex, error);
});

test('Does not wait for Duplex writable side', async t => {
	const error = new Error('test');
	const stream = new Duplex({
		read: onetime(function () {
			this.push(null);
		}),
		destroy(_, done) {
			done(error);
		},
	});

	t.is(await getStream(stream), '');
	t.is(await t.throwsAsync(onFinishedStream(stream)), error);
	assertWriteFail(t, stream, Duplex, error);
});

test('Handle non-error instances', async t => {
	const stream = Readable.from(fixtureMultiString);
	const errorMessage = `< ${fixtureString} >`;
	stream.destroy(errorMessage);
	const [{reason}] = await Promise.allSettled([onFinishedStream(stream)]);
	t.is(reason, errorMessage);
	assertReadFail(t, stream, Readable, errorMessage);

	await t.throwsAsync(getStreamAsArray(stream), {message: errorMessage});
});

test('Handles objectMode errors', async t => {
	const stream = new Readable({
		read: onetime(function () {
			this.push(fixtureString);
			this.push({});
		}),
		objectMode: true,
	});

	const error = await t.throwsAsync(getStream(stream), {message: /in object mode/});
	t.is(error.bufferedData, fixtureString);
	assertReadFail(t, stream, Readable);
});

test('Handles maxBuffer errors', async t => {
	const stream = new Readable({
		read: onetime(function () {
			this.push(fixtureString);
			this.push(fixtureString);
		}),
	});

	const error = await t.throwsAsync(
		getStream(stream, {maxBuffer: fixtureString.length}),
		{instanceOf: MaxBufferError},
	);
	t.is(error.bufferedData, fixtureString);
	assertReadFail(t, stream, Readable);
});

test('Works if Duplex readable side ends before its writable side', async t => {
	const stream = new Duplex(noopMethods);
	stream.push(null);

	t.deepEqual(await getStreamAsArray(stream), []);
	assertWriteFail(t, stream, Duplex);
});

test('Cleans up event listeners', async t => {
	const stream = Readable.from([]);
	t.is(stream.listenerCount('error'), 0);

	t.deepEqual(await getStreamAsArray(stream), []);

	t.is(stream.listenerCount('error'), 0);
});

const testMultipleReads = async (t, wait) => {
	const size = 10;
	const stream = new Readable({
		read: onetime(async function () {
			for (let index = 0; index < size; index += 1) {
				for (let index = 0; index < size; index += 1) {
					this.push(fixtureString);
				}

				// eslint-disable-next-line no-await-in-loop
				await wait();
			}

			this.push(null);
		}),
	});

	t.is(await getStream(stream), fixtureString.repeat(size * size));
	assertSuccess(t, stream, Readable);
};

test('Handles multiple successive fast reads', testMultipleReads, () => scheduler.yield());
test('Handles multiple successive slow reads', testMultipleReads, () => pSetTimeout(100));

// The `highWaterMark` option was added to `once()` by Node 20.
// See https://github.com/nodejs/node/pull/41276
const nodeMajor = version.split('.')[0].slice(1);
if (nodeMajor >= 20) {
	test('Pause stream when too much data at once', async t => {
		const stream = new Readable({
			read: onetime(function () {
				this.push('.');
				this.push('.');
				this.push('.');
				this.push('.');
				this.push(null);
			}),
			highWaterMark: 2,
		});
		const [result] = await Promise.all([
			getStream(stream),
			once(stream, 'pause'),
		]);
		t.is(result, '....');
		assertSuccess(t, stream, Readable);
	});
}

test('Can call twice at the same time', async t => {
	const stream = Readable.from(fixtureMultiString);
	const [result, secondResult] = await Promise.all([
		getStream(stream),
		getStream(stream),
	]);
	t.deepEqual(result, fixtureString);
	t.deepEqual(secondResult, fixtureString);
	assertSuccess(t, stream, Readable);
});

test('Can call and listen to "data" event at the same time', async t => {
	const stream = Readable.from([fixtureString]);
	const [result, secondResult] = await Promise.all([
		getStream(stream),
		once(stream, 'data'),
	]);
	t.deepEqual(result, fixtureString);
	t.deepEqual(secondResult.toString(), fixtureString);
	assertSuccess(t, stream, Readable);
});
