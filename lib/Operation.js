'use strict';

const {
    OP_PREFIX,
    FN_DELIM,
    ARG_DELIM
} = require('./constants');

const { flag, hasFlag } = require('./flags');

const ConfigStore = require('./store/Config');
const ResultStore = require('./store/Result');
const SettingStore = require('./store/Setting');

const Operation = (targets, operations, operation, compConfig) => {
    const [ name, argString ] = operation.split(FN_DELIM);
    const key = name.replace(OP_PREFIX, '');
    const args = (argString || '').split(ARG_DELIM).filter(v => v != null);
    args.push({ targets, config: ConfigStore, result: ResultStore, setting: SettingStore, compConfig });
    const __fn__ = operations[key] || null;
    if (typeof __fn__ !== 'function') throw new Error(`unknown operation: ${key}`);
    if (hasFlag(__fn__, 'fn')) return __fn__(...args);
    const fn = () => __fn__(...args);
    if (hasFlag(__fn__, 'binding')) flag(fn, 'binding');
    flag(fn, 'op');
    return { name: operation, fn, __fn__, ns: key };
};

module.exports = Operation;
