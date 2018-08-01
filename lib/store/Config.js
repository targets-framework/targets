'use strict';

const {
    clone,
    orObject
} = require('../util');

const { deepSet:set } = require('answers');
const unset = require('lodash/unset');

const ConfigStore = global[Symbol.for('targets-config-store')] = [];
const getPrevious = exports.getPrevious = (n = 1) => clone(orObject(ConfigStore[ConfigStore.length - n]));
const getLatest = exports.getLatest = () => getPrevious(1);
const push = exports.push = (config) => ConfigStore.push(config);
exports.set = (keypath, value) => push(set(getLatest(), keypath, value));
exports.baseMerge = (value) => push(set({ config: getLatest() }, 'config', value || {}).config);
exports.unset = (keypath) => push(unset(getLatest(), keypath));
