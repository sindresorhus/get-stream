import {getStreamContents} from './contents.js';
import {throwObjectStream, getLengthProp} from './utils.js';

export async function getStreamAsArrayBuffer(stream, options) {
	return getStreamContents(stream, arrayBufferMethods, options);
}

const initArrayBuffer = () => new Uint8Array(0);

const useTextEncoder = chunk => textEncoder.encode(chunk);
const textEncoder = new TextEncoder();

const useUint8Array = chunk => new Uint8Array(chunk);

const useUint8ArrayWithOffset = chunk => new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);

// `contents` is an increasingly growing `Uint8Array`.
const addArrayBufferChunk = (convertedChunk, contents, length, previousLength) => {
	const newContents = hasArrayBufferResize() ? resizeArrayBuffer(contents, length) : resizeArrayBufferSlow(contents, length);
	newContents.set(convertedChunk, previousLength);
	return newContents;
};

// Without `ArrayBuffer.resize()`, `contents` size is always a power of 2.
// This means its last bytes are zeroes (not stream data), which need to be
// trimmed at the end with `ArrayBuffer.slice()`.
const resizeArrayBufferSlow = (contents, length) => {
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
const resizeArrayBuffer = (contents, length) => {
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
// eslint-disable-next-line no-warning-comments
// TODO: remove after dropping support for Node 20.
// eslint-disable-next-line no-warning-comments
// TODO: use `ArrayBuffer.transferToFixedLength()` instead once it is available
const hasArrayBufferResize = () => 'resize' in ArrayBuffer.prototype;

const arrayBufferMethods = {
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
};
