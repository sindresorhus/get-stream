import {Buffer} from 'node:buffer';
import {compose, PassThrough as PassThroughStream} from 'node:stream';

export class MaxBufferError extends Error {
	name = 'MaxBufferError';

	constructor() {
		super('maxBuffer exceeded');
	}
}

export default async function getStream(inputStream, options = {}) {
	if (!inputStream) {
		throw new Error('Expected a stream');
	}

	const {maxBuffer = Number.POSITIVE_INFINITY, encoding = 'utf8'} = options;
	const isBuffer = encoding === 'buffer';

	const stream = new PassThroughStream({encoding: isBuffer ? undefined : encoding});

	const newStream = compose(inputStream, stream);

	let length = 0;
	const chunks = [];

	const getBufferedValue = () => isBuffer ? Buffer.concat(chunks, length) : chunks.join('');

	try {
		for await (const chunk of newStream) {
			chunks.push(chunk);
			length += chunk.length;

			if (length > maxBuffer) {
				throw new MaxBufferError();
			}
		}

		return getBufferedValue();
	} catch (error) {
		try {
			error.bufferedData = getBufferedValue();
			// This throws when the buffered data is larger than the maximum length
			// for a string or buffer
		} catch {}

		throw error;
	}
}

export async function getStreamAsBuffer(stream, options) {
	return getStream(stream, {...options, encoding: 'buffer'});
}
