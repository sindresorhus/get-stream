'use strict';
const pump = require('pump');
const bufferStream = require('./buffer-stream');

function getStream(inputStream, opts) {
	if (!inputStream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	opts = Object.assign({maxBuffer: Infinity}, opts);

	const {maxBuffer} = opts;
	let stream;

	return new Promise((resolve, reject) => {
		const error = err => {
			if (err) { // A null check
				err.bufferedData = stream.getBufferedValue();
			}
			reject(err);
		};

		stream = pump(inputStream, bufferStream(opts), err =>
			err ? error(err) : resolve()
		);
		stream.on('data', () => {
			if (stream.getBufferedLength() > maxBuffer) {
				stream.destroy(new Error('maxBuffer exceeded'));
			}
		});
	}).then(() => stream.getBufferedValue());
}

module.exports = getStream;
module.exports.buffer = (stream, opts) => getStream(stream, Object.assign({}, opts, {encoding: 'buffer'}));
module.exports.array = (stream, opts) => getStream(stream, Object.assign({}, opts, {array: true}));
