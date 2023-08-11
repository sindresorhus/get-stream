import {writeFile, rm} from 'node:fs/promises';

// Create and delete a big fixture file
export const createFixture = async () => {
	await writeFile(FIXTURE_FILE, '.'.repeat(FIXTURE_BYTE_SIZE));
};

export const deleteFixture = async () => {
	await rm(FIXTURE_FILE);
};

export const FIXTURE_FILE = 'benchmark_fixture';

const FIXTURE_BYTE_SIZE = 1e8;
export const FIXTURE_HUMAN_SIZE = `${FIXTURE_BYTE_SIZE / 1e6}MB`;
