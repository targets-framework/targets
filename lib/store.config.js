'use strict';
const { clone, orObject } = require('./util');

const cKey = Symbol.for('targets-config-store');
const configStore = exports.configStore = global[cKey] = [];
const getPreviousConfig = exports.getPreviousConfig = (n = 1) => clone(orObject(configStore[configStore.length - n]));
exports.getLatestConfig = () => getPreviousConfig(1);
