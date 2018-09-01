'use strict';
const prefix = process.env.TARGETS_SYMBOL_PREFIX || 'targets';

module.exports = {
    labelLength: Symbol.for(`${prefix}-label-length`),
    stateStore: Symbol.for(`${prefix}-state-store`),
    toggleStore: Symbol.for(`${prefix}-toggle-store`),
    settingStore: Symbol.for(`${prefix}-setting-store`)
};
