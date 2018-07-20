'use strict';

const {
    clone,
    orObject
} = require('../util');

const cKey = Symbol.for('targets-config-store');
const ConfigStore = global[cKey] = [];
const getPreviousConfig = (n = 1) => clone(orObject(ConfigStore[ConfigStore.length - n]));
const getLatestConfig = () => getPreviousConfig(1);

module.exports = ConfigStore;
module.exports.getPreviousConfig = getPreviousConfig;
module.exports.getLatestConfig = getLatestConfig;
