'use strict';

const {
    clone,
    orObject
} = require('../util');

const ConfigStore = global[Symbol.for('targets-config-store')] = [];
const getPrevious = exports.getPrevious = (n = 1) => clone(orObject(ConfigStore[ConfigStore.length - n]));
exports.getLatest = () => getPrevious(1);
exports.push = (config) => ConfigStore.push(config);
