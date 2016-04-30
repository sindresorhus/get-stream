'use strict';
var PassThrough = require('stream').PassThrough;
var Promise = require('pinkie-promise');
var objectAssign = require('object-assign');

function getStream(inputStream, opts) {
	if (!inputStream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	opts = objectAssign({maxBuffer: Infinity}, opts);

	var stream;
	var array = opts.array;
	var encoding = opts.encoding;
	var maxBuffer = opts.maxBuffer;

	var buffer = encoding === 'buffer';
	var objectMode = false;

	if (array) {
		objectMode = !(encoding || buffer);
	} else {
		encoding = encoding || 'utf8';
	}

	if (buffer) {
		encoding = null;
	}

	var len = 0;
	var ret = [];
	var clean;

	var p = new Promise(function (resolve, reject) {
		stream = new PassThrough({objectMode: objectMode});
		inputStream.pipe(stream);

		if (encoding) {
			stream.setEncoding(encoding);
		}

		var onData = function (chunk) {
			ret.push(chunk);

			if (objectMode) {
				len = ret.length;
			} else {
				len += chunk.length;
			}

			if (len > maxBuffer) {
				reject(new Error('maxBuffer exceeded'));
			}
		};

		stream.on('data', onData);
		stream.on('error', reject);
		stream.on('end', resolve);

		clean = function () {
			stream.removeListener('data', onData);
		};
	});

	p.then(clean, clean);

	return p.then(function () {
		if (array) {
			return ret;
		}
		return buffer ? Buffer.concat(ret, len) : ret.join('');
	});
}

module.exports = getStream;

module.exports.buffer = function (stream, opts) {
	return getStream(stream, objectAssign({}, opts, {encoding: 'buffer'}));
};

module.exports.array = function (stream, opts) {
	return getStream(stream, objectAssign({}, opts, {array: true}));
};
