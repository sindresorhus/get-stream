export const getStreamContents = async (stream, {init, convertChunk, getSize, addChunk, finalize}, {maxBuffer = Number.POSITIVE_INFINITY} = {}) => {
	if (!isAsyncIterable(stream)) {
		throw new Error('The first argument must be a Readable, a ReadableStream, or an async iterable.');
	}

	let length = 0;
	let contents = init();
	const textDecoder = new TextDecoder();

	try {
		for await (const chunk of stream) {
			const chunkType = getChunkType(chunk);
			const convertedChunk = convertChunk[chunkType](chunk, textDecoder);
			const chunkSize = getSize(convertedChunk);

			if (length + chunkSize > maxBuffer) {
				throw new MaxBufferError();
			}

			const newLength = length + chunkSize;
			contents = addChunk(convertedChunk, contents, newLength, length);
			length = newLength;
		}

		return finalize(contents, length, textDecoder);
	} catch (error) {
		error.bufferedData = finalize(contents, length, textDecoder);
		throw error;
	}
};

const isAsyncIterable = stream => typeof stream === 'object' && stream !== null && typeof stream[Symbol.asyncIterator] === 'function';

const getChunkType = chunk => {
	const typeOfChunk = typeof chunk;

	if (typeOfChunk === 'string') {
		return 'string';
	}

	if (typeOfChunk !== 'object' || chunk === null) {
		return 'others';
	}

	// eslint-disable-next-line n/prefer-global/buffer
	if (globalThis.Buffer?.isBuffer(chunk)) {
		return 'buffer';
	}

	const prototypeName = objectToString.call(chunk);

	if (prototypeName === '[object ArrayBuffer]') {
		return 'arrayBuffer';
	}

	if (prototypeName === '[object DataView]') {
		return 'dataView';
	}

	if (
		Number.isInteger(chunk.byteLength)
		&& Number.isInteger(chunk.byteOffset)
		&& objectToString.call(chunk.buffer) === '[object ArrayBuffer]'
	) {
		return 'typedArray';
	}

	return 'others';
};

const {toString: objectToString} = Object.prototype;

export class MaxBufferError extends Error {
	name = 'MaxBufferError';

	constructor() {
		super('maxBuffer exceeded');
	}
}
