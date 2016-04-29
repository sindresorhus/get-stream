'use strict';
var PassThrough = require('stream').PassThrough;
var Promise = require('pinkie-promise');

function getStream(inputStream, opts) {
	if (!inputStream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	var stream;
	var array = opts && opts.array;
	var encoding = opts && opts.encoding;
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

	function onData(chunk) {
		if (buffer) {
			len += chunk.length;
		}

		ret.push(chunk);
	}

	var p = new Promise(function (resolve, reject) {
		stream = new PassThrough({objectMode: objectMode});
		inputStream.pipe(stream);

		if (encoding) {
			stream.setEncoding(encoding);
		}

		stream.on('data', onData);
		stream.on('error', reject);
		stream.on('end', resolve);
	});

	var clean = function () {
		stream.removeListener('data', onData);
	};

	p.then(clean, clean);

	return p.then(function () {
		if (array) {
			return ret;
		}
		return buffer ? Buffer.concat(ret, len) : ret.join('');
	});
}

module.exports = getStream;

module.exports.buffer = function (stream) {
	return getStream(stream, {encoding: 'buffer'});
};

module.exports.array = function (stream, opts) {
	return getStream(stream, {array: true, encoding: opts && opts.encoding});
};
