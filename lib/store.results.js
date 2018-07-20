'use strict';
const { clone, orObject } = require('./util');

const rKey = Symbol.for('targets-result-store');
const resultStore = exports.resultStore = global[rKey] = [];
const getPreviousResult = exports.getPreviousResult = (n = 1) => clone(orObject(resultStore[resultStore.length - n]));
exports.getLatestResult = () => getPreviousResult(1);
