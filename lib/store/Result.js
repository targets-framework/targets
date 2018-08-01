'use strict';

const {
    clone,
    orObject
} = require('../util');

const ResultStore = global[Symbol.for('targets-result-store')] = [];
const getPrevious = exports.getPrevious = (n = 1) => clone(orObject(ResultStore[ResultStore.length - n]));
exports.getLatest = () => getPrevious(1);
exports.push = (result) => ResultStore.push(result);
