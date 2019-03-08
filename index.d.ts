/// <reference types="node"/>

import {Stream} from 'stream';

export interface Options {
	/**
	 * Maximum length of the returned string. If it exceeds this value before the stream ends, the promise will be rejected with a `MaxBufferError` error.
	 *
	 * @default Infinity
	 */
	readonly maxBuffer?: number;
}

export interface OptionsWithEncoding<EncodingType = BufferEncoding>
	extends Options {
	/**
	 * [Encoding](https://nodejs.org/api/buffer.html#buffer_buffer) of the incoming stream.
	 *
	 * @default 'utf8'
	 */
	readonly encoding?: EncodingType;
}

declare const getStream: {
	/**
	 * Get the `stream` as a string.
	 *
	 * @returns A promise that resolves when the end event fires on the stream, indicating that there is no more data to be read. The stream is switched to flowing mode.
	 */
	(stream: Stream, options?: OptionsWithEncoding): Promise<string>;

	/**
	 * Get the `stream` as a buffer.
	 *
	 * It honors the `maxBuffer` option as above, but it refers to byte length rather than string length.
	 */
	buffer(stream: Stream, options?: OptionsWithEncoding): Promise<Buffer>;

	/**
	 * Get the `stream` as an array of values.
	 *
	 * It honors both the `maxBuffer` and `encoding` options. The behavior changes slightly based on the encoding chosen:
	 *
	 * - When `encoding` is unset, it assumes an [object mode stream](https://nodesource.com/blog/understanding-object-streams/) and collects values emitted from `stream` unmodified. In this case `maxBuffer` refers to the number of items in the array (not the sum of their sizes).
	 * - When `encoding` is set to `buffer`, it collects an array of buffers. `maxBuffer` refers to the summed byte lengths of every buffer in the array.
	 * - When `encoding` is set to anything else, it collects an array of strings. `maxBuffer` refers to the summed character lengths of every string in the array.
	 */
	array<StreamObjectModeType = unknown>(
		stream: Stream,
		options?: Options
	): Promise<StreamObjectModeType[]>;
	array(
		stream: Stream,
		options: OptionsWithEncoding<'buffer'>
	): Promise<Buffer[]>;
	array(
		stream: Stream,
		options: OptionsWithEncoding<BufferEncoding>
	): Promise<string[]>;
};

export default getStream;

export class MaxBufferError extends Error {
	readonly name: 'MaxBufferError';
	constructor();
}
