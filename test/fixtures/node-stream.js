import process from 'node:process';
import getStream from 'get-stream';
import {createStream} from '../helpers/index.js';
import {fixtureString} from './index.js';

const stream = createStream([fixtureString]);
const [output, secondOutput] = await Promise.all([getStream(stream), getStream(stream)]);
process.stdout.write(`${output}${secondOutput}`);
