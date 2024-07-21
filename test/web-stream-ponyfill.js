import test from 'ava';

// Emulate browsers that do not support those methods
// eslint-disable-next-line n/no-unsupported-features/node-builtins
delete ReadableStream.prototype.values;
// eslint-disable-next-line n/no-unsupported-features/node-builtins
delete ReadableStream.prototype[Symbol.asyncIterator];

// Run those tests, but emulating browsers
await import('./web-stream.js');

test('Should not polyfill ReadableStream', t => {
	// eslint-disable-next-line n/no-unsupported-features/node-builtins
	t.is(ReadableStream.prototype.values, undefined);
	// eslint-disable-next-line n/no-unsupported-features/node-builtins
	t.is(ReadableStream.prototype[Symbol.asyncIterator], undefined);
});
