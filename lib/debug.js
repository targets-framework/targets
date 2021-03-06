'use strict';

const { OP_PREFIX } = require('./Operation');
const DEBUG = exports.DEBUG = 'debug';
const { get } = require('./Toggle');
exports.inDebugMode = (name = '') => get(DEBUG) || name.startsWith(`${OP_PREFIX}${DEBUG}`);
