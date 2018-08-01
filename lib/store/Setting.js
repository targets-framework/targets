'use strict';

const SettingStore = global[Symbol.for('targets-setting-store')] = {};
exports.get = (prop) => SettingStore[prop];
exports.set = (prop, value) => SettingStore[prop] = value;
