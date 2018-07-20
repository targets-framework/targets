'use strict';

const {
    clone,
    orObject
} = require('../util');

const rKey = Symbol.for('targets-result-store');
const ResultStore = global[rKey] = [];
const getPreviousResult = (n = 1) => clone(orObject(ResultStore[ResultStore.length - n]));
const getLatestResult = () => getPreviousResult(1);

module.exports = ResultStore;
module.exports.getPreviousResult = getPreviousResult;
module.exports.getLatestResult = getLatestResult;
