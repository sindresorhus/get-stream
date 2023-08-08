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
		error.bufferedData = getBufferedData(chunks, getContents, length);
		throw error;
	}
};

const getBufferedData = (chunks, getContents, length) => {
	try {
		return getContents(chunks, length);
	} catch {
		return truncateBufferedValue(chunks, getContents);
	}
};

// If the input is larger than the maximum length for a string or a buffer,
// it will fail. We retry it with increasingly smaller inputs, so that
// `error.bufferedData` is still set, albeit with a truncated value, since that
// is still useful for debugging.
const truncateBufferedValue = (chunks, getContents) => {
	let chunksCount = chunks.length;
	do {
		chunksCount = Math.floor(chunksCount / SPLIT_FACTOR);
		try {
			return getContents(chunks.slice(0, chunksCount));
		} catch {}
	} while (chunksCount > 0);
};

const SPLIT_FACTOR = 2;

const convertChunkToBuffer = chunk => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

const getContentsAsBuffer = (chunks, length) => Buffer.concat(chunks, length);

const convertChunkToString = chunk => typeof chunk === 'string' ? chunk : chunk.toString();

const getContentsAsString = chunks => chunks.join('');

const chunkTypes = {
	buffer: {convertChunk: convertChunkToBuffer, getContents: getContentsAsBuffer},
	string: {convertChunk: convertChunkToString, getContents: getContentsAsString},
};
