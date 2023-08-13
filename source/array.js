import {getStreamContents} from './contents.js';
import {identity} from './utils.js';

export async function getStreamAsArray(stream, options) {
	return getStreamContents(stream, arrayMethods, options);
}

const initArray = () => ([]);

const increment = () => 1;

const addArrayChunk = (convertedChunk, contents) => {
	contents.push(convertedChunk);
	return contents;
};

const arrayMethods = {
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
};
