import {Duplex, Readable} from 'node:stream';
import {finished} from 'node:stream/promises';

// @todo Use ReadableStream.from() after dropping support for Node 18
export {fromAnyIterable as readableStreamFrom} from '@sec-ant/readable-stream/ponyfill';

export const createStream = streamDefinition => typeof streamDefinition === 'function'
	? Duplex.from(streamDefinition)
	: Readable.from(streamDefinition);

// Tests related to big buffers/strings can be slow. We run them serially and
// with a higher timeout to ensure they do not randomly fail.
export const BIG_TEST_DURATION = '2m';

export const onFinishedStream = stream => finished(stream, {cleanup: true});
