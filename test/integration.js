import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import {open, opendir} from 'node:fs/promises';
import {version as nodeVersion} from 'node:process';
import {Duplex} from 'node:stream';
import test from 'ava';
import getStream, {getStreamAsBuffer, getStreamAsArray} from '../source/index.js';
import {fixtureString, fixtureBuffer, fixtureUtf16} from './fixtures/index.js';

const TEST_URL = 'https://nodejs.org/dist/index.json';

const createReadableStream = streamDef => Duplex.toWeb(Duplex.from(streamDef)).readable;

test('works with opendir()', async t => {
	const directoryFiles = await opendir('.');
	const entries = await getStreamAsArray(directoryFiles);
	t.true(entries.some(({name}) => name === 'package.json'));
});

test('works with createReadStream() and buffers', async t => {
	const result = await getStreamAsBuffer(createReadStream('fixture'));
	t.true(result.equals(fixtureBuffer));
});

test('works with createReadStream() and utf8', async t => {
	const result = await getStream(createReadStream('fixture', 'utf8'));
	t.is(result, fixtureString);
});

test('works with child_process.spawn()', async t => {
	const {stdout} = spawn('node', ['--version'], {stdio: ['ignore', 'pipe', 'ignore']});
	const result = await getStream(stdout);
	t.is(result.trim(), nodeVersion);
});

// @todo: remove this condition after dropping support for Node 16.
// `ReadableStream` was added in Node 16.5.0.
// `Duplex.toWeb()` and `fileHandle.readableWebStream` were added in Node 17.0.0.
// `fetch()` without an experimental flag was added in Node 18.0.0.
// However, `get-stream`'s implementation does not refer to any of those
// variables and functions. Instead, it only supports specific chunk types
// (`TypedArray`, `DataView`, `ArrayBuffer`) for any async iterable.
// Doing so automatically works with `ReadableStream`s, regardless of whether
// the environment supports them.
if (!nodeVersion.startsWith('v16.')) {
	test('works with ReadableStream', async t => {
		const result = await getStream(createReadableStream(fixtureString));
		t.is(result, fixtureString);
	});

	const readableWebStream = async (t, type) => {
		const fileHandle = await open('fixture');

		try {
			const result = await getStream(fileHandle.readableWebStream({type}));
			t.is(result, fixtureString);
		} finally {
			await fileHandle.close();
		}
	};

	test('works with readableWebStream({ type: undefined })', readableWebStream, undefined);
	test('works with readableWebStream({ type: "bytes" })', readableWebStream, 'bytes');

	test('works with fetch()', async t => {
		const {body} = await fetch(TEST_URL);
		const result = await getStream(body);
		const parsedResult = JSON.parse(result);
		t.true(Array.isArray(parsedResult));
	});

	test('can use TextDecoderStream', async t => {
		const textDecoderStream = new TextDecoderStream('utf-16le');
		const result = await getStream(
			createReadableStream(fixtureUtf16).pipeThrough(textDecoderStream),
		);
		t.is(result, fixtureString);
	});
}
