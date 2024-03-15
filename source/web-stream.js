export const ponyfill = {};

const {prototype} = ReadableStream;

// Use this library as a ponyfill instead of a polyfill.
// I.e. avoid modifying global variables.
// We can remove this once https://github.com/Sec-ant/readable-stream/issues/2 is fixed
if (prototype[Symbol.asyncIterator] === undefined && prototype.values === undefined) {
	await import('@sec-ant/readable-stream');
	ponyfill.asyncIterator = prototype[Symbol.asyncIterator];
	delete prototype[Symbol.asyncIterator];
	delete prototype.values;
}
