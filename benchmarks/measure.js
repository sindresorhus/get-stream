import now from 'precise-now';

// Return how many ms running `task()` takes
export const measureTask = async ({start, stop}, task) => {
	const taskInputs = await Promise.all(Array.from({length: MAX_LOOPS + 1}, start));

	// Pre-warm
	await task(taskInputs[0].stream);

	const startTimestamp = now();
	for (let index = 1; index <= MAX_LOOPS; index += 1) {
		// eslint-disable-next-line no-await-in-loop
		await task(taskInputs[index].stream);
	}

	const duration = Math.round((now() - startTimestamp) / (MAX_LOOPS * NANOSECS_TO_MILLESECS));

	await Promise.all(taskInputs.map(taskInput => stop(taskInput)));

	return duration;
};

const MAX_LOOPS = 10;
const NANOSECS_TO_MILLESECS = 1e6;
