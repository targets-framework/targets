'use strict';

module.exports = Queue;

const { merge } = require('sugarmerge');

const Target = require('./Target');
const { isTargetName } = Target;

const Operation = require('./Operation');
const {
    OP_PREFIX,
    isOperation,
    isBindShorthand,
    isReBindShorthand
} = Operation;

const { tag, hasTag } = require('./tags');

const conform = (arg) => {
    if (isBindShorthand(arg)) return `${OP_PREFIX}bind/${arg}`;
    if (isReBindShorthand(arg)) return `${OP_PREFIX}rebind/${arg.replace(OP_PREFIX,'')}`;
    return arg;
};

const Unit = (arg, targets, operations, config = {}, predicates = [], name) => {
    if (typeof arg === 'string' && arg.includes(',')) {
        const parallel = arg.split(',');
        if (config) parallel.config = config;
        const unit = Unit(parallel, targets, operations, config, predicates);
        tag(unit, 'parallel');
        return unit;
    }
    if (Array.isArray(arg)) {
        if (hasTag(arg, 'parallel')) return arg;
        return arg.reduce((a, n) => [
                ...a,
                Unit(n, targets, operations, merge(config, arg.config || {}), [ ...predicates, ...(arg.predicates || []) ])
            ], []);
    }
    if (typeof arg === 'string') {
        const name = conform(arg);
        if (isOperation(name)) return [ Operation(name, targets, operations, config, predicates) ];
        return Unit(targets[name], targets, operations, config, predicates, name);
    }
    if (typeof arg === 'function') {
        return [ Target(arg, name, config, predicates) ];
    }
    throw new Error(`invalid target in command: ${name}`);
};

function Queue({ targets, operations, args }) {
    return args
        .reduce((acc, arg, i, col) => isTargetName(col[i - 1], arg)
              ? [ ...acc, Unit(arg, targets, operations) ]
              : acc,
        []);
}
