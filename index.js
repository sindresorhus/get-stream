'use strict';
var Promise = require('pinkie-promise');

module.exports = function (stream, opts) {
	if (!stream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	opts = opts || {};

	var ret = '';

	function onData(chunk) {
		ret += chunk;
	}

	var p = new Promise(function (resolve, reject) {
		stream.setEncoding(opts.encoding || 'utf8');
		stream.on('data', onData);
		stream.on('error', reject);
		stream.on('end', resolve);
	});

	var clean = function () {
		stream.removeListener('data', onData);
	};

	p.then(clean, clean);

	return p.then(function () {
		return ret;
	});
};

module.exports.buffer = function (stream) {
	if (!stream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	var ret = [];
	var len = 0;

	function onData(chunk) {
		ret.push(chunk);
		len += chunk.length;
	}

	var p = new Promise(function (resolve, reject) {
		stream.on('data', onData);
		stream.on('error', reject);
		stream.on('end', resolve);
	});

	var clean = function () {
		stream.removeListener('data', onData);
	};

	p.then(clean, clean);

	return p.then(function () {
		return Buffer.concat(ret, len);
	});
};

module.exports.array = function (stream) {
	if (!stream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	var ret = [];

	function onData(obj) {
		ret.push(obj);
	}

	var p = new Promise(function (resolve, reject) {
		stream.on('data', onData);
		stream.on('error', reject);
		stream.on('end', resolve);
	});

	var clean = function () {
		stream.removeListener('data', onData);
	};

	p.then(clean, clean);

	return p.then(function () {
		return ret;
	});
};
