import process from 'node:process';
import getStream from 'get-stream';
import {readableStreamFrom} from '../helpers/index.js';
import {fixtureString} from './index.js';

const stream = readableStreamFrom([fixtureString]);
process.stdout.write(await getStream(stream));
