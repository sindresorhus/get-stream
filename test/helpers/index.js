import {Duplex, Readable} from 'node:stream';

export const createStream = streamDef => typeof streamDef === 'function'
	? Duplex.from(streamDef)
	: Readable.from(streamDef);

// Tests related to big buffers/strings can be slow. We run them serially and
// with a higher timeout to ensure they do not randomly fail.
export const BIG_TEST_DURATION = '2m';
