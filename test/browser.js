import {execFile} from 'node:child_process';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import test from 'ava';
import {fixtureString} from './fixtures/index.js';

const pExecFile = promisify(execFile);
const cwd = dirname(fileURLToPath(import.meta.url));
const nodeStreamFixture = './fixtures/node-stream.js';
const webStreamFixture = './fixtures/web-stream.js';
const iterableFixture = './fixtures/iterable.js';
const nodeConditions = [];
const browserConditions = ['--conditions=browser'];

const testEntrypoint = async (t, fixture, conditions, expectedOutput = fixtureString) => {
	const {stdout, stderr} = await pExecFile('node', [...conditions, fixture], {cwd});
	t.is(stderr, '');
	t.is(stdout, expectedOutput);
};

test('Node entrypoint works with Node streams', testEntrypoint, nodeStreamFixture, nodeConditions, `${fixtureString}${fixtureString}`);
test('Browser entrypoint works with Node streams', testEntrypoint, nodeStreamFixture, browserConditions);
test('Node entrypoint works with web streams', testEntrypoint, webStreamFixture, nodeConditions);
test('Browser entrypoint works with web streams', testEntrypoint, webStreamFixture, browserConditions);
test('Node entrypoint works with async iterables', testEntrypoint, iterableFixture, nodeConditions);
test('Browser entrypoint works with async iterables', testEntrypoint, iterableFixture, browserConditions);
