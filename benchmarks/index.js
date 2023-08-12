import {createFixture, deleteFixture, FIXTURE_HUMAN_SIZE} from './fixture.js';
import {createNodeStreamBinary, createNodeStreamText, createWebStreamBinary, createWebStreamText} from './stream.js';
import {logHeader, benchmarkNodeStreams, benchmarkStreams} from './log.js';

await createFixture();

try {
	logHeader(`Node.js stream (${FIXTURE_HUMAN_SIZE}, binary)`);
	await benchmarkNodeStreams(createNodeStreamBinary);

	console.log('');
	logHeader(`Node.js stream (${FIXTURE_HUMAN_SIZE}, text)`);
	await benchmarkNodeStreams(createNodeStreamText);

	console.log('');
	logHeader(`Web ReadableStream (${FIXTURE_HUMAN_SIZE}, binary)`);
	await benchmarkStreams(createWebStreamBinary);

	console.log('');
	logHeader(`Web ReadableStream (${FIXTURE_HUMAN_SIZE}, text)`);
	await benchmarkStreams(createWebStreamText);
} finally {
	await deleteFixture();
}
