import {Buffer} from 'node:buffer';

export const fixtureString = 'unicorn\n';
export const fixtureLength = fixtureString.length;
export const fixtureBuffer = Buffer.from(fixtureString);
export const fixtureTypedArray = new TextEncoder().encode(fixtureString);
export const fixtureArrayBuffer = fixtureTypedArray.buffer;
export const fixtureUint16Array = new Uint16Array(fixtureArrayBuffer);
export const fixtureDataView = new DataView(fixtureArrayBuffer);
export const fixtureUtf16 = Buffer.from(fixtureString, 'utf-16le');

export const fixtureMultiString = [...fixtureString];
const fixtureMultiBytes = [...fixtureBuffer];
export const fixtureMultiBuffer = fixtureMultiBytes.map(byte => Buffer.from([byte]));
export const fixtureMultiTypedArray = fixtureMultiBytes.map(byte => new Uint8Array([byte]));
export const fixtureMultiArrayBuffer = fixtureMultiTypedArray.map(({buffer}) => buffer);
export const fixtureMultiUint16Array = Array.from({length: fixtureMultiBytes.length / 2}, (_, index) =>
	new Uint16Array([((2 ** 8) * fixtureMultiBytes[(index * 2) + 1]) + fixtureMultiBytes[index * 2]]),
);
export const fixtureMultiDataView = fixtureMultiArrayBuffer.map(arrayBuffer => new DataView(arrayBuffer));

const fixtureStringWide = `  ${fixtureString}  `;
const fixtureTypedArrayWide = new TextEncoder().encode(fixtureStringWide);
const fixtureArrayBufferWide = fixtureTypedArrayWide.buffer;
export const fixtureTypedArrayWithOffset = new Uint8Array(fixtureArrayBufferWide, 2, fixtureString.length);
export const fixtureUint16ArrayWithOffset = new Uint16Array(fixtureArrayBufferWide, 2, fixtureString.length / 2);
export const fixtureDataViewWithOffset = new DataView(fixtureArrayBufferWide, 2, fixtureString.length);

export const longString = `${fixtureString}..`;
export const fixtureMultibyteString = '\u1000';
export const longMultibyteString = `${fixtureMultibyteString}\u1000`;

export const bigArray = Array.from({length: 1e5}, () => Math.floor(Math.random() * (2 ** 8)));

export const prematureClose = {code: 'ERR_STREAM_PREMATURE_CLOSE'};
