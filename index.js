'use strict';
var PassThrough = require('stream').PassThrough;
var Promise = require('pinkie-promise');

function getStream(inputStream, opts) {
	if (!inputStream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	var stream;
	var encoding = (opts && opts.encoding) || 'utf8';
	var buffer = encoding === 'buffer';
	var array = encoding === 'array';

	if (buffer || array) {
		encoding = null;
	}

	var len = 0;
	var ret = encoding ? '' : [];

	function onData(chunk) {
		if (buffer) {
			len += chunk.length;
		}

		if (encoding) {
			ret += chunk;
		} else {
			ret.push(chunk);
		}
	}

	var p = new Promise(function (resolve, reject) {
		stream = new PassThrough({objectMode: array});
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
		return buffer ? Buffer.concat(ret, len) : ret;
	});
}

module.exports = getStream;

module.exports.buffer = function (stream) {
	return getStream(stream, {encoding: 'buffer'});
};

module.exports.array = function (stream) {
	return getStream(stream, {encoding: 'array'});
};
