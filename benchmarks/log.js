import {text, buffer, arrayBuffer} from 'node:stream/consumers';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer, getStreamAsArray} from '../index.js';
import {measureTask} from './measure.js';

export const benchmarkNodeStreams = async createStream => {
	await benchmarkStreams(createStream);
	await logResult('stream.toArray', createStream, stream => stream.toArray());
};

export const benchmarkStreams = async createStream => {
	await logResult('getStream', createStream, getStream);
	await logResult('text', createStream, text);
	await logResult('getStreamAsBuffer', createStream, getStreamAsBuffer);
	await logResult('buffer', createStream, buffer);
	await logResult('getStreamAsArrayBuffer', createStream, getStreamAsArrayBuffer);
	await logResult('arrayBuffer', createStream, arrayBuffer);
	await logResult('getStreamAsArray', createStream, getStreamAsArray);
};

export const logHeader = header => {
	console.log(`### ${header}\n`);
};

const logResult = async (name, createStream, task) => {
	console.log(`- \`${name}()\`: ${await measureTask(createStream, task)}ms`);
};
