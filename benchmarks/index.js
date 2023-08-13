import {text, buffer, arrayBuffer} from 'node:stream/consumers';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer, getStreamAsArray} from '../source/index.js';
import {createFixture, deleteFixture, FIXTURE_HUMAN_SIZE} from './fixture.js';
import {createNodeStreamBinary, createNodeStreamText, createWebStreamBinary, createWebStreamText} from './stream.js';
import {measureTask} from './measure.js';

const runBenchmarks = async () => {
	await createFixture();

	try {
		await benchmarkNodeStreams(createNodeStreamBinary, `Node.js stream (${FIXTURE_HUMAN_SIZE}, binary)`);
		await benchmarkNodeStreams(createNodeStreamText, `Node.js stream (${FIXTURE_HUMAN_SIZE}, text)`);
		await benchmarkStreams(createWebStreamBinary, `Web ReadableStream (${FIXTURE_HUMAN_SIZE}, binary)`);
		await benchmarkStreams(createWebStreamText, `Web ReadableStream (${FIXTURE_HUMAN_SIZE}, text)`);
	} finally {
		await deleteFixture();
	}
};

const benchmarkNodeStreams = async (createStream, header) => {
	await benchmarkStreams(createStream, header);
	await logResult('stream.toArray', createStream, stream => stream.toArray());
};

const benchmarkStreams = async (createStream, header) => {
	logHeader(header);
	await logResult('getStream', createStream, getStream);
	await logResult('text', createStream, text);
	await logResult('getStreamAsBuffer', createStream, getStreamAsBuffer);
	await logResult('buffer', createStream, buffer);
	await logResult('getStreamAsArrayBuffer', createStream, getStreamAsArrayBuffer);
	await logResult('arrayBuffer', createStream, arrayBuffer);
	await logResult('getStreamAsArray', createStream, getStreamAsArray);
};

const logHeader = header => {
	console.log(`\n### ${header}\n`);
};

const logResult = async (name, createStream, task) => {
	console.log(`- \`${name}()\`: ${await measureTask(createStream, task)}ms`);
};

await runBenchmarks();
