'use strict';

const OP_PREFIX = '@';
const OP_DELIM = '/';
const OP_ARG_DELIM = '::';

const { tag, hasTag } = require('./tags');

const ConfigStore = require('./store/Config');
const ResultStore = require('./store/Result');
const SettingStore = require('./store/Setting');

const Predicates = require('./Predicates');

const Operation = (operation, targets, operations, parentConfig, parentPredicates) => {
    const [ name, argString ] = operation.split(OP_DELIM);
    const key = name.replace(OP_PREFIX, '');
    const args = (argString || '').split(OP_ARG_DELIM).filter(v => v != null);
    args.push({ targets, config: ConfigStore, result: ResultStore, setting: SettingStore, parentConfig, parentPredicates });
    const __fn__ = operations[key] || null;
    if (typeof __fn__ !== 'function') throw new Error(`unknown operation: ${key}`);
    if (hasTag(__fn__, 'target')) return __fn__(...args);
    const fn = () => __fn__(...args);
    if (hasTag(__fn__, 'binding')) tag(fn, 'binding');
    tag(fn, 'op');
    return { name: operation, fn, __fn__, ns: key, parentPredicates: Predicates(parentPredicates) };
};
Operation.OP_PREFIX = OP_PREFIX;
Operation.OP_DELIM = OP_DELIM;
Operation.OP_ARG_DELIM = OP_ARG_DELIM;

const argsOnly = Operation.argsOnly = (v) => !v.includes(OP_DELIM) && v.includes(OP_ARG_DELIM);
const isOperation = Operation.isOperation = (v) => new RegExp(`^${OP_PREFIX}.+`).test(v);
Operation.isBindShorthand = (v) => argsOnly(v) && !isOperation(v);
Operation.isReBindShorthand = (v) => argsOnly(v) && isOperation(v);

module.exports = Operation;
