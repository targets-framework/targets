'use strict';

const BINDING_FLAG = exports.BINDING_FLAG = '__binding__';
const OP_FLAG = exports.OP_FLAG = '__operation__';
exports.OP_FLAGS = [ BINDING_FLAG, OP_FLAG ];

exports.ARG_DELIM = '::';
exports.OP_PREFIX = '@';
exports.FN_DELIM = '/';

exports.PARALLEL_FLAG = '__parallel__';

// toggles
exports.SILENT_TOGGLE = 'silent';
exports.DEBUG_TOGGLE = 'DEBUG';
