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
	if (!isAsyncIterable(stream)) {
		throw new Error('The first argument must be a Readable.');
	}

	let length = 0;
	const chunks = [];
	const textDecoder = new TextDecoder();

	try {
		for await (const chunk of stream) {
			const convertedChunk = convertChunk(chunk, textDecoder);
			chunks.push(convertedChunk);
			length += convertedChunk.length;

			if (length > maxBuffer) {
				throw new MaxBufferError();
			}
		}

		return getContents(chunks, textDecoder, length);
	} catch (error) {
		error.bufferedData = getBufferedData(chunks, getContents, textDecoder, length);
		throw error;
	}
};

const isAsyncIterable = stream => typeof stream === 'object' && stream !== null && typeof stream[Symbol.asyncIterator] === 'function';

const getBufferedData = (chunks, getContents, textDecoder, length) => {
	try {
		return getContents(chunks, textDecoder, length);
	} catch {
		return truncateBufferedValue(chunks, getContents, textDecoder);
	}
};

// If the input is larger than the maximum length for a string or a buffer,
// it will fail. We retry it with increasingly smaller inputs, so that
// `error.bufferedData` is still set, albeit with a truncated value, since that
// is still useful for debugging.
const truncateBufferedValue = (chunks, getContents, textDecoder) => {
	let chunksCount = chunks.length;
	do {
		chunksCount = Math.floor(chunksCount / SPLIT_FACTOR);
		try {
			return getContents(chunks.slice(0, chunksCount), textDecoder);
		} catch {}
	} while (chunksCount > 0);
};

const SPLIT_FACTOR = 2;

const convertChunkToBuffer = chunk => Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

const getContentsAsBuffer = (chunks, textDecoder, length) => Buffer.concat(chunks, length);

const convertChunkToString = (chunk, textDecoder) => typeof chunk === 'string' ? chunk : textDecoder.decode(chunk, {stream: true});

const getContentsAsString = (chunks, textDecoder) => `${chunks.join('')}${textDecoder.decode()}`;

const chunkTypes = {
	buffer: {convertChunk: convertChunkToBuffer, getContents: getContentsAsBuffer},
	string: {convertChunk: convertChunkToString, getContents: getContentsAsString},
};
