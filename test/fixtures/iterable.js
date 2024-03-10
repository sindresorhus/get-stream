import process from 'node:process';
import getStream from 'get-stream';
import {createStream} from '../helpers/index.js';
import {fixtureString} from './index.js';

const generator = async function * () {
	yield fixtureString;
};

const stream = createStream(generator);
process.stdout.write(await getStream(stream));
