import {text, buffer, arrayBuffer} from 'node:stream/consumers';
import getStream, {getStreamAsBuffer, getStreamAsArrayBuffer, getStreamAsArray} from '../index.js';
import {createFixture, deleteFixture, FIXTURE_HUMAN_SIZE} from './fixture.js';
import {measureTask} from './measure.js';
import {createNodeStreamBinary, createNodeStreamText, createWebStreamBinary, createWebStreamText} from './stream.js';

await createFixture();

try {
	console.log(`### Node.js stream (${FIXTURE_HUMAN_SIZE}, binary)\n`);
	console.log(`- getStream(): ${await measureTask(createNodeStreamBinary, getStream)}ms`);
	console.log(`- text(): ${await measureTask(createNodeStreamBinary, text)}ms`);
	console.log(`- getStreamAsBuffer(): ${await measureTask(createNodeStreamBinary, getStreamAsBuffer)}ms`);
	console.log(`- buffer(): ${await measureTask(createNodeStreamBinary, buffer)}ms`);
	console.log(`- getStreamAsArrayBuffer(): ${await measureTask(createNodeStreamBinary, getStreamAsArrayBuffer)}ms`);
	console.log(`- arrayBuffer(): ${await measureTask(createNodeStreamBinary, arrayBuffer)}ms`);
	console.log(`- getStreamAsArray(): ${await measureTask(createNodeStreamBinary, getStreamAsArray)}ms`);
	console.log(`- stream.toArray(): ${await measureTask(createNodeStreamBinary, stream => stream.toArray())}ms`);

	console.log(`\n### Node.js stream (${FIXTURE_HUMAN_SIZE}, text)\n`);
	console.log(`- getStream(): ${await measureTask(createNodeStreamText, getStream)}ms`);
	console.log(`- text(): ${await measureTask(createNodeStreamText, text)}ms`);
	console.log(`- getStreamAsBuffer(): ${await measureTask(createNodeStreamText, getStreamAsBuffer)}ms`);
	console.log(`- buffer(): ${await measureTask(createNodeStreamText, buffer)}ms`);
	console.log(`- getStreamAsArrayBuffer(): ${await measureTask(createNodeStreamText, getStreamAsArrayBuffer)}ms`);
	console.log(`- arrayBuffer(): ${await measureTask(createNodeStreamText, arrayBuffer)}ms`);
	console.log(`- getStreamAsArray(): ${await measureTask(createNodeStreamText, getStreamAsArray)}ms`);
	console.log(`- stream.toArray(): ${await measureTask(createNodeStreamText, stream => stream.toArray())}ms`);

	console.log(`\n### Web ReadableStream (${FIXTURE_HUMAN_SIZE}, binary)\n`);
	console.log(`- getStream(): ${await measureTask(createWebStreamBinary, getStream)}ms`);
	console.log(`- text(): ${await measureTask(createWebStreamBinary, text)}ms`);
	console.log(`- getStreamAsBuffer(): ${await measureTask(createWebStreamBinary, getStreamAsBuffer)}ms`);
	console.log(`- buffer(): ${await measureTask(createWebStreamBinary, buffer)}ms`);
	console.log(`- getStreamAsArrayBuffer(): ${await measureTask(createWebStreamBinary, getStreamAsArrayBuffer)}ms`);
	console.log(`- arrayBuffer(): ${await measureTask(createWebStreamBinary, arrayBuffer)}ms`);
	console.log(`- getStreamAsArray(): ${await measureTask(createWebStreamBinary, getStreamAsArray)}ms`);

	console.log(`\n### Web ReadableStream (${FIXTURE_HUMAN_SIZE}, text)\n`);
	console.log(`- getStream(): ${await measureTask(createWebStreamText, getStream)}ms`);
	console.log(`- text(): ${await measureTask(createWebStreamText, text)}ms`);
	console.log(`- getStreamAsBuffer(): ${await measureTask(createWebStreamText, getStreamAsBuffer)}ms`);
	console.log(`- buffer(): ${await measureTask(createWebStreamText, buffer)}ms`);
	console.log(`- getStreamAsArrayBuffer(): ${await measureTask(createWebStreamText, getStreamAsArrayBuffer)}ms`);
	console.log(`- arrayBuffer(): ${await measureTask(createWebStreamText, arrayBuffer)}ms`);
	console.log(`- getStreamAsArray(): ${await measureTask(createWebStreamText, getStreamAsArray)}ms`);
} finally {
	await deleteFixture();
}
