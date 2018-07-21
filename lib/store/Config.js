'use strict';

const {
    clone,
    orObject
} = require('../util');

const { deepSet:set } = require('answers');

const ConfigStore = global[Symbol.for('targets-config-store')] = [];
const getPrevious = exports.getPrevious = (n = 1) => clone(orObject(ConfigStore[ConfigStore.length - n]));
const getLatest = exports.getLatest = () => getPrevious(1);
const push = exports.push = (config) => ConfigStore.push(config);
exports.set = (keypath, value) => push(set(getLatest(), keypath, value));
