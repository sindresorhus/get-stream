import {open} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {FIXTURE_FILE} from './fixture.js';

const createNodeStream = encoding => ({
	start: () => ({stream: createReadStream(FIXTURE_FILE, encoding)}),
	stop() {},
});

export const createNodeStreamBinary = createNodeStream(undefined);
export const createNodeStreamText = createNodeStream('utf8');

const createWebStream = type => ({
	async start() {
		const fileHandle = await open(FIXTURE_FILE);
		const stream = fileHandle.readableWebStream({type});
		return {fileHandle, stream};
	},
	async stop({fileHandle}) {
		await fileHandle.close();
	},
});

export const createWebStreamBinary = createWebStream('bytes');
// `Text` is somewhat of a misnomer here:
//   - `fs.readableWebStream({ type: 'bytes' })` creates a `ReadableStream` with a "bytes controller" and `Uint8Array` chunks
//   - `fs.readableWebStream({ type: undefined })` creates a `ReadableStream` with a "default controller" and `ArrayBuffer` chunks.
//      Node.js currently does not allow creating a file-based `ReadableStream` with string chunks.
export const createWebStreamText = createWebStream(undefined);
