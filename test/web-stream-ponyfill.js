import test from 'ava';

// Emulate browsers that do not support those methods
delete ReadableStream.prototype.values;
delete ReadableStream.prototype[Symbol.asyncIterator];

// Run those tests, but emulating browsers
await import('./web-stream.js');

test('Should not polyfill ReadableStream', t => {
	t.is(ReadableStream.prototype.values, undefined);
	t.is(ReadableStream.prototype[Symbol.asyncIterator], undefined);
});
