'use strict';

const {
    OP_PREFIX,
    FLAGS,
    FN_DELIM,
    ARG_DELIM
} = require('./constants');

exports.hasFlag = (fn) => Object.keys(fn).reduce((acc, p) => acc || FLAGS.includes(p), false);

const argsOnly = (v) => !v.includes(FN_DELIM) && v.includes(ARG_DELIM);
const isOperation = exports.isOperation = (v) => new RegExp(`^${OP_PREFIX}.+`).test(v);
exports.isBindShorthand = (v) => argsOnly(v) && !isOperation(v);
exports.isReBindShorthand = (v) => argsOnly(v) && isOperation(v);

const isTarget = exports.isTarget = (prev, v) => !/^--?/.test(prev || '') && !/^--?/.test(v);

exports.hasTargets = (argv) => !!argv
    .reduce((acc, arg, i, col) => isTarget(col[i - 1], arg)
            ? [ ...acc, arg ]
            : acc,
        []).length;

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
