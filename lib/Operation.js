'use strict';

const {
    OP_FLAG,
    OP_PREFIX,
    FN_DELIM,
    ARG_DELIM
} = require('./constants');

const ConfigStore = require('./store/Config');
const ResultStore = require('./store/Result');
const SettingStore = require('./store/Setting');

const Operation = (operations, operation) => {
    const [ name, argString ] = operation.split(FN_DELIM);
    const key = name.replace(OP_PREFIX, '');
    const args = (argString || '').split(ARG_DELIM).filter(v => v != null);
    args.push({ config: ConfigStore, result: ResultStore, setting: SettingStore });
    const __fn__ = operations[key] || null;
    const fn = typeof __fn__ === 'function'
        ? () => __fn__(...args)
        : () => 'unknown operation';
    fn[operations[key].flag || OP_FLAG] = true;
    return { name: operation, fn, __fn__, ns: key };
};

module.exports = Operation;
