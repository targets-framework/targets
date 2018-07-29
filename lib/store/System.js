'use strict';

const SystemStore = global[Symbol.for('targets-system-store')] = {};
exports.get = (prop) => SystemStore[prop];
exports.set = (prop, value) => SystemStore[prop] = value;
