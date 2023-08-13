// eslint-disable-next-line no-use-extend-native/no-use-extend-native
delete ArrayBuffer.prototype.resize;

// eslint-disable-next-line import/no-unassigned-import, ava/no-import-test-files, import/first
import './array-buffer.js';
