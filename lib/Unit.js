'use strict';

module.exports = Unit;

const { merge } = require('sugarmerge');
const { isObject } = require('./util');

const Target = require('./Target');

const Operation = require('./Operation');
const {
    OP_PREFIX,
    isOperation,
    isBindShorthand
} = Operation;

const { tag, hasTag } = require('./tags');

const conform = (arg) => {
    if (isBindShorthand(arg)) return `${OP_PREFIX}bind/${arg.replace(OP_PREFIX,'')}`;
    return arg;
};

function Unit({ arg, targets, operations, loaders, config = {}, predicates = [], silent = false, name }) {

    if (typeof arg === 'string' && arg.includes(',')) {

        const parallel = arg.split(',');
        if (config) parallel.config = config;
        const unit = Unit({ arg: parallel, targets, operations, loaders, config, predicates, silent });
        tag(unit, 'parallel');

        return unit;
    }

    if (Array.isArray(arg)) {

        if (hasTag(arg, 'parallel')) return arg;

        return arg.reduce((a, n) => [
                ...a,
                Unit({ arg: n, targets, operations, loaders, config: merge(config, arg.config || {}), predicates: [ ...predicates, ...(arg.predicates || []) ], silent })
            ], []);
    }

    if (isObject(arg)) {

        const { kind } = arg;
        if (typeof loaders[kind] != 'function') throw new Error(`${kind} is not a valid loader`);
        const target = loaders[kind](arg);
        if (target.alias && targets[target.alias] == null) targets[target.alias] = target;

        return Unit({ arg: target, targets, operations, loaders, config, predicates, silent, name: target.alias || name });
    }

    if (typeof arg === 'string') {

        const name = conform(arg);
        if (isOperation(name)) return [ Operation({ operation: name, targets, operations, loaders, config, predicates, silent }) ];

        return Unit({ arg: targets[name], targets, operations, loaders, config, predicates, silent, name });
    }

    if (typeof arg === 'function') return [ Target({ fn: arg, name, config, predicates, silent }) ];

    throw new Error(`invalid target in command: ${name}`);
}
