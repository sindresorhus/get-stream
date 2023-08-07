import {Buffer, constants as BufferConstants} from 'node:buffer';
import {PassThrough as PassThroughStream} from 'node:stream';
import {pipeline as streamPipeline} from 'node:stream/promises';

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

	const stream = await getNewStream(inputStream, encoding, isBuffer);

	let length = 0;
	const chunks = [];

	const getBufferedValue = () => isBuffer ? Buffer.concat(chunks, length) : chunks.join('');

	for await (const chunk of stream) {
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

const getNewStream = async (inputStream, encoding, isBuffer) => {
	const hasSameEncoding = (inputStream.readableEncoding ?? 'buffer') === encoding;

	if (hasSameEncoding) {
		return inputStream;
	}

	const newEncoding = isBuffer ? undefined : encoding;
	const stream = new PassThroughStream({highWaterMark: maxHighWaterMark, encoding: newEncoding});

	await streamPipeline(inputStream, stream);

	return stream;
};

export async function getStreamAsBuffer(stream, options) {
	return getStream(stream, {...options, encoding: 'buffer'});
}
