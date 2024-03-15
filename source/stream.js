import {isReadableStream} from 'is-stream';
import {ponyfill} from './web-stream.js';

export const getAsyncIterable = stream => {
	if (isReadableStream(stream, {checkOpen: false})) {
		return getStreamIterable(stream);
	}

	if (typeof stream?.[Symbol.asyncIterator] === 'function') {
		return stream;
	}

	// `ReadableStream[Symbol.asyncIterator]` support is missing in multiple browsers, so we ponyfill it
	if (toString.call(stream) === '[object ReadableStream]') {
		return ponyfill.asyncIterator.call(stream);
	}

	throw new TypeError('The first argument must be a Readable, a ReadableStream, or an async iterable.');
};

const {toString} = Object.prototype;

// The default iterable for Node.js streams does not allow for multiple readers at once, so we re-implement it
const getStreamIterable = async function * (stream) {
	if (nodeImports === undefined) {
		await loadNodeImports();
	}

	const controller = new AbortController();
	const state = {};
	handleStreamEnd(stream, controller, state);

	try {
		for await (const [chunk] of nodeImports.events.on(stream, 'data', {
			signal: controller.signal,
			highWatermark: stream.readableHighWaterMark,
		})) {
			yield chunk;
		}
	} catch (error) {
		// Stream failure, for example due to `stream.destroy(error)`
		if (state.error !== undefined) {
			throw state.error;
		// `error` event directly emitted on stream
		} else if (!controller.signal.aborted) {
			throw error;
		// Otherwise, stream completed successfully
		}
		// The `finally` block also runs when the caller throws, for example due to the `maxBuffer` option
	} finally {
		stream.destroy();
	}
};

const handleStreamEnd = async (stream, controller, state) => {
	try {
		await nodeImports.streamPromises.finished(stream, {cleanup: true, readable: true, writable: false, error: false});
	} catch (error) {
		state.error = error;
	} finally {
		controller.abort();
	}
};

// Use dynamic imports to support browsers
const loadNodeImports = async () => {
	const [events, streamPromises] = await Promise.all([
		import('node:events'),
		import('node:stream/promises'),
	]);
	nodeImports = {events, streamPromises};
};

let nodeImports;
