import {Buffer} from 'node:buffer';

export class MaxBufferError extends Error {
	name = 'MaxBufferError';

	constructor() {
		super('maxBuffer exceeded');
	}
}

export async function getStreamAsBuffer(stream, options) {
	return getStreamContents(stream, chunkTypes.buffer, options);
}

export default async function getStream(stream, options) {
	return getStreamContents(stream, chunkTypes.string, options);
}

const getStreamContents = async (stream, {convertChunk, getContents}, {maxBuffer = Number.POSITIVE_INFINITY} = {}) => {
	if (!stream) {
		throw new Error('Expected a stream');
	}

	let length = 0;
	const chunks = [];

	try {
		for await (const chunk of stream) {
			const convertedChunk = convertChunk(chunk);
			chunks.push(convertedChunk);
			length += convertedChunk.length;

			if (length > maxBuffer) {
				throw new MaxBufferError();
			}
		}

		return getContents(chunks, length);
	} catch (error) {
		try {
			error.bufferedData = getContents(chunks, length);
			// This throws when the buffered data is larger than the maximum length
			// for a string or buffer
		} catch {}

		throw error;
	}
};

const convertChunkToBuffer = chunk => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

const getContentsAsBuffer = (chunks, length) => Buffer.concat(chunks, length);

const convertChunkToString = chunk => typeof chunk === 'string' ? chunk : chunk.toString();

const getContentsAsString = chunks => chunks.join('');

const chunkTypes = {
	buffer: {convertChunk: convertChunkToBuffer, getContents: getContentsAsBuffer},
	string: {convertChunk: convertChunkToString, getContents: getContentsAsString},
};
