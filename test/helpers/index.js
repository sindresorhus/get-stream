import {Duplex, Readable} from 'node:stream';
import {finished} from 'node:stream/promises';

export const createStream = streamDef => typeof streamDef === 'function'
	? Duplex.from(streamDef)
	: Readable.from(streamDef);

// @todo Use ReadableStream.from() after dropping support for Node 18
export const readableStreamFrom = chunks => new ReadableStream({
	start(controller) {
		for (const chunk of chunks) {
			controller.enqueue(chunk);
		}

		controller.close();
	},
});

// Tests related to big buffers/strings can be slow. We run them serially and
// with a higher timeout to ensure they do not randomly fail.
export const BIG_TEST_DURATION = '2m';

export const onFinishedStream = stream => finished(stream, {cleanup: true});
