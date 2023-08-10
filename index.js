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

const getStreamContents = async (stream, {init, convertChunk, getSize, addChunk, finalize}, {maxBuffer = Number.POSITIVE_INFINITY} = {}) => {
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

			const previousLength = length;
			length += chunkSize;
			contents = addChunk(convertedChunk, contents, length, previousLength);
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

const identity = value => value;

const throwObjectStream = chunk => {
	throw new Error(`Streams in object mode are not supported: ${String(chunk)}`);
};

const getLengthProp = convertedChunk => convertedChunk.length;

const initArray = () => ([]);

const increment = () => 1;

const addArrayChunk = (convertedChunk, contents) => {
	contents.push(convertedChunk);
	return contents;
};

const initArrayBuffer = () => new Uint8Array(0);

const useTextEncoder = chunk => textEncoder.encode(chunk);
const textEncoder = new TextEncoder();

const useUint8Array = chunk => new Uint8Array(chunk);

const useUint8ArrayWithOffset = chunk => new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);

// `contents` is an increasingly growing `Uint8Array`.
const addArrayBufferChunk = (convertedChunk, contents, length, previousLength) => {
	const newContents = hasArrayBufferResize() ? resizeArrayBufferFast(contents, length) : resizeArrayBuffer(contents, length);
	newContents.set(convertedChunk, previousLength);
	return newContents;
};

// Without `ArrayBuffer.resize()`, `contents` size is always a power of 2.
// This means its last bytes are zeroes (not stream data), which need to be
// trimmed at the end with `ArrayBuffer.slice()`.
const resizeArrayBuffer = (contents, length) => {
	if (length <= contents.length) {
		return contents;
	}

	const newContents = new Uint8Array(getNewContentsLength(length));
	newContents.set(contents, 0);
	return newContents;
};

// With `ArrayBuffer.resize()`, `contents` size matches exactly the size of
// the stream data. It does not include extraneous zeroes to trim at the end.
// The underlying `ArrayBuffer` does allocate a number of bytes that is a power
// of 2, but those bytes are only visible after calling `ArrayBuffer.resize()`.
const resizeArrayBufferFast = (contents, length) => {
	if (length <= contents.buffer.maxByteLength) {
		contents.buffer.resize(length);
		return new Uint8Array(contents.buffer, 0, length);
	}

	const arrayBuffer = new ArrayBuffer(length, {maxByteLength: getNewContentsLength(length)});
	const newContents = new Uint8Array(arrayBuffer);
	newContents.set(contents, 0);
	return newContents;
};

// Retrieve the closest `length` that is both >= and a power of 2
const getNewContentsLength = length => SCALE_FACTOR ** Math.ceil(Math.log(length) / Math.log(SCALE_FACTOR));

const SCALE_FACTOR = 2;

const finalizeArrayBuffer = ({buffer}, length) => hasArrayBufferResize() ? buffer : buffer.slice(0, length);

// `ArrayBuffer.slice()` is slow. When `ArrayBuffer.resize()` is available
// (Node >=20.0.0, Safari >=16.4 and Chrome), we can use it instead.
const hasArrayBufferResize = () => 'resize' in ArrayBuffer.prototype;

const initString = () => '';

const useTextDecoder = (chunk, textDecoder) => textDecoder.decode(chunk, {stream: true});

const addStringChunk = (convertedChunk, contents) => contents + convertedChunk;

const finalizeString = (contents, length, textDecoder) => `${contents}${textDecoder.decode()}`;

const chunkTypes = {
	array: {
		init: initArray,
		convertChunk: {
			string: identity,
			buffer: identity,
			arrayBuffer: identity,
			dataView: identity,
			typedArray: identity,
			others: identity,
		},
		getSize: increment,
		addChunk: addArrayChunk,
		finalize: identity,
	},
	arrayBuffer: {
		init: initArrayBuffer,
		convertChunk: {
			string: useTextEncoder,
			buffer: useUint8Array,
			arrayBuffer: useUint8Array,
			dataView: useUint8ArrayWithOffset,
			typedArray: useUint8ArrayWithOffset,
			others: throwObjectStream,
		},
		getSize: getLengthProp,
		addChunk: addArrayBufferChunk,
		finalize: finalizeArrayBuffer,
	},
	string: {
		init: initString,
		convertChunk: {
			string: identity,
			buffer: useTextDecoder,
			arrayBuffer: useTextDecoder,
			dataView: useTextDecoder,
			typedArray: useTextDecoder,
			others: throwObjectStream,
		},
		getSize: getLengthProp,
		addChunk: addStringChunk,
		finalize: finalizeString,
	},
};
