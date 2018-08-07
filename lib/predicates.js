'use strict';

const {
    OP_PREFIX,
    FN_DELIM,
    ARG_DELIM,
    DEBUG_TOGGLE:DEBUG
} = require('./constants');

const {
    get:getToggle
} = require('./store/Toggles');


const argsOnly = (v) => !v.includes(FN_DELIM) && v.includes(ARG_DELIM);
const isOperation = exports.isOperation = (v) => new RegExp(`^${OP_PREFIX}.+`).test(v);
exports.isBindShorthand = (v) => argsOnly(v) && !isOperation(v);
exports.isReBindShorthand = (v) => argsOnly(v) && isOperation(v);
exports.inDebugMode = (name = '') => getToggle(DEBUG) || name.startsWith(`${OP_PREFIX}${DEBUG}`);

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

exports.isPty = obj =>
    obj !== null &&
    typeof obj._pty === 'string';
