import {Buffer, constants as BufferConstants} from 'node:buffer';
import {compose, PassThrough as PassThroughStream} from 'node:stream';

const maxHighWaterMark = 2_147_483_647;

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

	const stream = new PassThroughStream({highWaterMark: maxHighWaterMark, encoding: isBuffer ? undefined : encoding});

	const newStream = compose(inputStream, stream);

	let length = 0;
	const chunks = [];

	const getBufferedValue = () => isBuffer ? Buffer.concat(chunks, length) : chunks.join('');

	for await (const chunk of newStream) {
		chunks.push(chunk);
		length += chunk.length;

		if (length > maxBuffer) {
			const error = new MaxBufferError();

			if (length <= BufferConstants.MAX_LENGTH) {
				error.bufferedData = getBufferedValue();
			}

			throw error;
		}
	}

	return getBufferedValue();
}

export async function getStreamAsBuffer(stream, options) {
	return getStream(stream, {...options, encoding: 'buffer'});
}
