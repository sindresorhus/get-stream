import {text, buffer, arrayBuffer} from 'node:stream/consumers';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer, getStreamAsArray} from '../index.js';
import {createFixture, deleteFixture, FIXTURE_HUMAN_SIZE} from './fixture.js';
import {measureTask} from './measure.js';
import {createNodeStreamBinary, createNodeStreamText, createWebStreamBinary, createWebStreamText} from './stream.js';

await createFixture();

const logHeader = header => {
	console.log(`### ${header}\n`);
};

const logResult = async (name, createStream, task) => {
	console.log(`- \`${name}()\`: ${await measureTask(createStream, task)}ms`);
};

try {
	logHeader(`Node.js stream (${FIXTURE_HUMAN_SIZE}, binary)`);
	await logResult('getStream', createNodeStreamBinary, getStream);
	await logResult('text', createNodeStreamBinary, text);
	await logResult('getStreamAsBuffer', createNodeStreamBinary, getStreamAsBuffer);
	await logResult('buffer', createNodeStreamBinary, buffer);
	await logResult('getStreamAsArrayBuffer', createNodeStreamBinary, getStreamAsArrayBuffer);
	await logResult('arrayBuffer', createNodeStreamBinary, arrayBuffer);
	await logResult('getStreamAsArray', createNodeStreamBinary, getStreamAsArray);
	await logResult('stream.toArray', createNodeStreamBinary, stream => stream.toArray());

	console.log('');
	logHeader(`Node.js stream (${FIXTURE_HUMAN_SIZE}, text)`);
	await logResult('getStream', createNodeStreamText, getStream);
	await logResult('text', createNodeStreamText, text);
	await logResult('getStreamAsBuffer', createNodeStreamText, getStreamAsBuffer);
	await logResult('buffer', createNodeStreamText, buffer);
	await logResult('getStreamAsArrayBuffer', createNodeStreamText, getStreamAsArrayBuffer);
	await logResult('arrayBuffer', createNodeStreamText, arrayBuffer);
	await logResult('getStreamAsArray', createNodeStreamText, getStreamAsArray);
	await logResult('stream.toArray', createNodeStreamText, stream => stream.toArray());

	console.log('');
	logHeader(`Web ReadableStream (${FIXTURE_HUMAN_SIZE}, binary)`);
	await logResult('getStream', createWebStreamBinary, getStream);
	await logResult('text', createWebStreamBinary, text);
	await logResult('getStreamAsBuffer', createWebStreamBinary, getStreamAsBuffer);
	await logResult('buffer', createWebStreamBinary, buffer);
	await logResult('getStreamAsArrayBuffer', createWebStreamBinary, getStreamAsArrayBuffer);
	await logResult('arrayBuffer', createWebStreamBinary, arrayBuffer);
	await logResult('getStreamAsArray', createWebStreamBinary, getStreamAsArray);

	console.log('');
	logHeader(`Web ReadableStream (${FIXTURE_HUMAN_SIZE}, text)`);
	await logResult('getStream', createWebStreamText, getStream);
	await logResult('text', createWebStreamText, text);
	await logResult('getStreamAsBuffer', createWebStreamText, getStreamAsBuffer);
	await logResult('buffer', createWebStreamText, buffer);
	await logResult('getStreamAsArrayBuffer', createWebStreamText, getStreamAsArrayBuffer);
	await logResult('arrayBuffer', createWebStreamText, arrayBuffer);
	await logResult('getStreamAsArray', createWebStreamText, getStreamAsArray);
} finally {
	await deleteFixture();
}
