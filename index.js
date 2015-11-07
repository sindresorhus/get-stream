'use strict';

var PinkiePromise = require('pinkie-promise');

module.exports = function (stream) {
	if (!stream) {
		return PinkiePromise.reject(new Error('Expected a stream'));
	}

	var ret = '';

	return new PinkiePromise(function (resolve, reject) {
		stream.setEncoding('utf8');

		stream.on('readable', function () {
			var chunk;

			while ((chunk = stream.read())) {
				ret += chunk;
			}
		});

		stream.on('error', reject);

		stream.on('end', function () {
			resolve(ret);
		});
	});
};

module.exports.buffer = function (stream) {
	if (!stream) {
		return PinkiePromise.reject(new Error('Expected a stream'));
	}

	var ret = [];
	var len = 0;

	return new PinkiePromise(function (resolve, reject) {
		stream.on('readable', function () {
			var chunk;

			while ((chunk = stream.read())) {
				ret.push(chunk);
				len += chunk.length;
			}
		});

		stream.on('error', reject);

		stream.on('end', function () {
			resolve(Buffer.concat(ret, len));
		});
	});
};
