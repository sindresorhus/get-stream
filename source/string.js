import {getStreamContents} from './contents.js';
import {identity, getContentsProp, throwObjectStream, getLengthProp} from './utils.js';

export async function getStreamAsString(stream, options) {
	return getStreamContents(stream, stringMethods, options);
}

const initString = () => ({contents: '', textDecoder: new TextDecoder()});

const useTextDecoder = (chunk, {textDecoder}) => textDecoder.decode(chunk, {stream: true});

const addStringChunk = (convertedChunk, {contents}) => contents + convertedChunk;

const getFinalStringChunk = ({textDecoder}) => {
	const finalChunk = textDecoder.decode();
	return finalChunk === '' ? undefined : finalChunk;
};

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
	getFinalChunk: getFinalStringChunk,
	finalize: getContentsProp,
};
