import test from 'ava';
import getStream from '../source/index.js';
import {fixtureString, fixtureMultiString} from './fixtures/index.js';
import {readableStreamFrom, onFinishedStream} from './helpers/index.js';

test('Can use ReadableStream', async t => {
	const stream = readableStreamFrom(fixtureMultiString);
	t.is(await getStream(stream), fixtureString);
	await onFinishedStream(stream);
});

test('Can use already ended ReadableStream', async t => {
	const stream = readableStreamFrom(fixtureMultiString);
	t.is(await getStream(stream), fixtureString);
	t.is(await getStream(stream), '');
	await onFinishedStream(stream);
});

test('Can use already canceled ReadableStream', async t => {
	let canceledValue;
	const stream = new ReadableStream({
		cancel(canceledError) {
			canceledValue = canceledError;
		},
	});
	const error = new Error('test');
	await stream.cancel(error);
	t.is(canceledValue, error);
	t.is(await getStream(stream), '');
	await onFinishedStream(stream);
});

test('Can use already errored ReadableStream', async t => {
	const error = new Error('test');
	const stream = new ReadableStream({
		start(controller) {
			controller.error(error);
		},
	});
	t.is(await t.throwsAsync(getStream(stream)), error);
	t.is(await t.throwsAsync(onFinishedStream(stream)), error);
});

test('Cancel ReadableStream when maxBuffer is hit', async t => {
	let canceled = false;
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(fixtureString);
			controller.enqueue(fixtureString);
			controller.close();
		},
		cancel() {
			canceled = true;
		},
	});
	const error = await t.throwsAsync(
		getStream(stream, {maxBuffer: 1}),
		{message: /maxBuffer exceeded/},
	);
	t.deepEqual(error.bufferedData, fixtureString[0]);
	await onFinishedStream(stream);
	t.true(canceled);
});
