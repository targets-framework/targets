'use strict';

const { BINDING_DELIM, OP_PREFIX, RESERVED_NS } = require('./constants');

exports.isReservedNs = (ns) => RESERVED_NS.includes(ns);
const isOperation = exports.isOperation = (v) => new RegExp(`^${OP_PREFIX}.+`).test(v);
const isBinding = exports.isBinding = (v) => new RegExp(`.+${BINDING_DELIM}.+`).test(v);
exports.isResultBinding = (v) => isBinding(v) && !isOperation(v);
exports.isConfigBinding = (v) => isOperation(v) && isBinding(v);
exports.isTarget = (prev, v) => !/^--?/.test(prev || '') && !/^--?/.test(v);
exports.isPromise = (obj) => !!obj &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function';
exports.isReadableStream = stream =>
    stream !== null &&
    typeof stream === 'object' &&
    typeof stream.pipe === 'function' &&
    stream.readable !== false &&
    typeof stream._read === 'function' &&
    typeof stream._readableState === 'object';
