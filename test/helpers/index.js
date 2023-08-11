import {Duplex} from 'node:stream';

export const createStream = streamDef => {
	const generator = typeof streamDef === 'function' ? streamDef : function * () {
		yield * streamDef;
	};

	return Duplex.from(generator);
};

// Tests related to big buffers/strings can be slow. We run them serially and
// with a higher timeout to ensure they do not randomly fail.
export const BIG_TEST_DURATION = '2m';
