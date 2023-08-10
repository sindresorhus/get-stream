export class MaxBufferError extends Error {
	name = 'MaxBufferError';

	constructor() {
		super('maxBuffer exceeded');
	}
}

export async function getStreamAsArray(stream, options) {
	return getStreamContents(stream, chunkTypes.array, options);
}

export async function getStreamAsBuffer(stream, options) {
	if (!('Buffer' in globalThis)) {
		throw new Error('getStreamAsBuffer() is only supported in Node.js');
	}

	try {
		return arrayBufferToNodeBuffer(await getStreamAsArrayBuffer(stream, options));
	} catch (error) {
		if (error.bufferedData !== undefined) {
			error.bufferedData = arrayBufferToNodeBuffer(error.bufferedData);
		}

		throw error;
	}
}

// eslint-disable-next-line n/prefer-global/buffer
const arrayBufferToNodeBuffer = arrayBuffer => globalThis.Buffer.from(arrayBuffer);

export async function getStreamAsArrayBuffer(stream, options) {
	return getStreamContents(stream, chunkTypes.arrayBuffer, options);
}

export default async function getStream(stream, options) {
	return getStreamContents(stream, chunkTypes.string, options);
}

const getStreamContents = async (stream, {convertChunk, getSize, getContents}, {maxBuffer = Number.POSITIVE_INFINITY} = {}) => {
	if (!isAsyncIterable(stream)) {
		throw new Error('The first argument must be a Readable, a ReadableStream, or an async iterable.');
	}

	let length = 0;
	const chunks = [];
	const textDecoder = new TextDecoder();

	try {
		for await (const chunk of stream) {
			const chunkType = getChunkType(chunk);
			const convertedChunk = convertChunk[chunkType](chunk, textDecoder);
			chunks.push(convertedChunk);
			length += getSize(convertedChunk);

			if (length > maxBuffer) {
				throw new MaxBufferError();
			}
		}

		return getContents(chunks, textDecoder, length);
	} catch (error) {
		error.bufferedData = getBufferedData({chunks, getContents, getSize, textDecoder, length});
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

const getBufferedData = ({chunks, getContents, getSize, textDecoder, length}) => {
	try {
		return getContents(chunks, textDecoder, length);
	} catch {
		return truncateBufferedValue({chunks, getContents, getSize, textDecoder});
	}
};

// If the input is larger than the maximum length for a string or a buffer,
// it will fail. We retry it with increasingly smaller inputs, so that
// `error.bufferedData` is still set, albeit with a truncated value, since that
// is still useful for debugging.
const truncateBufferedValue = ({chunks, getContents, getSize, textDecoder}) => {
	let chunksCount = chunks.length;
	do {
		chunksCount = Math.floor(chunksCount / SPLIT_FACTOR);
		const fewerChunks = chunks.slice(0, chunksCount);

		let length = 0;
		for (const chunk of fewerChunks) {
			length += getSize(chunk);
		}

		try {
			return getContents(fewerChunks, textDecoder, length);
		} catch {}
	} while (chunksCount > 0);
};

const SPLIT_FACTOR = 2;

const identity = value => value;

const throwObjectStream = chunk => {
	throw new Error(`Streams in object mode are not supported: ${String(chunk)}`);
};

const increment = () => 1;

const getLengthProp = convertedChunk => convertedChunk.length;

const useTextEncoder = chunk => textEncoder.encode(chunk);
const textEncoder = new TextEncoder();

const useUint8Array = chunk => new Uint8Array(chunk);

const useUint8ArrayWithOffset = chunk => new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);

const getContentsAsArrayBuffer = (chunks, textDecoder, length) => {
	const contents = new Uint8Array(length);

	let offset = 0;
	for (const chunk of chunks) {
		contents.set(chunk, offset);
		offset += chunk.length;
	}

	return contents.buffer;
};

const useTextDecoder = (chunk, textDecoder) => textDecoder.decode(chunk, {stream: true});

const getContentsAsString = (chunks, textDecoder) => `${chunks.join('')}${textDecoder.decode()}`;

const chunkTypes = {
	array: {
		convertChunk: {
			string: identity,
			buffer: identity,
			arrayBuffer: identity,
			dataView: identity,
			typedArray: identity,
			others: identity,
		},
		getSize: increment,
		getContents: identity,
	},
	arrayBuffer: {
		convertChunk: {
			string: useTextEncoder,
			buffer: useUint8Array,
			arrayBuffer: useUint8Array,
			dataView: useUint8ArrayWithOffset,
			typedArray: useUint8ArrayWithOffset,
			others: throwObjectStream,
		},
		getSize: getLengthProp,
		getContents: getContentsAsArrayBuffer,
	},
	string: {
		convertChunk: {
			string: identity,
			buffer: useTextDecoder,
			arrayBuffer: useTextDecoder,
			dataView: useTextDecoder,
			typedArray: useTextDecoder,
			others: throwObjectStream,
		},
		getSize: getLengthProp,
		getContents: getContentsAsString,
	},
};
