import {getStreamContents} from './contents.js';
import {identity, throwObjectStream, getLengthProp} from './utils.js';

export async function getStreamAsString(stream, options) {
	return getStreamContents(stream, stringMethods, options);
}

const initString = () => '';

const useTextDecoder = (chunk, textDecoder) => textDecoder.decode(chunk, {stream: true});

const addStringChunk = (convertedChunk, contents) => contents + convertedChunk;

const finalizeString = (contents, length, textDecoder) => `${contents}${textDecoder.decode()}`;

const stringMethods = {
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
};
