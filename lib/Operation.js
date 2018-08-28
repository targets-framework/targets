'use strict';

module.exports = Operation;

const OP_PREFIX = '@';
const OP_DELIM = '/';
const OP_ARG_DELIM = '::';

const { tag, hasTag } = require('./tags');

const Store = require('./Store');

const Predicates = require('./Predicates');

function Operation({ operation, targets, operations, loaders, config, predicates }) {
    const [ name, argString ] = operation.split(OP_DELIM);

    const key = name.replace(OP_PREFIX, '');

    const args = (argString || '').split(OP_ARG_DELIM).filter(v => v != null);
    args.push({ targets, operations, loaders, config, predicates, Store });

    const __fn__ = operations[key] || null;

    if (typeof __fn__ !== 'function') throw new Error(`unknown operation: ${key}`);

    if (hasTag(__fn__, 'target')) return __fn__(...args);

    const fn = () => __fn__(...args);

    if (hasTag(__fn__, 'binding')) tag(fn, 'binding');

    tag(fn, 'op');

    return { name: operation, label: operation, fn, __fn__, ns: key, parentPredicates: Predicates(predicates) };
}

Operation.OP_PREFIX = OP_PREFIX;
Operation.OP_DELIM = OP_DELIM;
Operation.OP_ARG_DELIM = OP_ARG_DELIM;

const argsOnly = Operation.argsOnly = (v) => !v.includes(OP_DELIM) && v.includes(OP_ARG_DELIM);
const isOperation = Operation.isOperation = (v) => new RegExp(`^${OP_PREFIX}.+`).test(v);
Operation.isBindShorthand = (v) => argsOnly(v) && isOperation(v);
