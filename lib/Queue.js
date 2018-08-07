'use strict';

module.exports = Queue;

const { merge } = require('sugarmerge');

const Operation = require('./Operation');
const Fn = require('./Fn');

const { OP_PREFIX } = require('./constants');

const { flag, hasFlag } = require('./flags');

const {
    isOperation,
    isTarget,
    isBindShorthand,
    isReBindShorthand
} = require('./predicates');

const conform = (arg) => {
    if (isBindShorthand(arg)) return `${OP_PREFIX}bind/${arg}`;
    if (isReBindShorthand(arg)) return `${OP_PREFIX}rebind/${arg.replace(OP_PREFIX,'')}`;
    return arg;
};

const Group = (targets, operations, arg, name, compConfig = {}) => {
    if (typeof arg === 'string' && arg.includes(',')) {
        const parallel = arg.split(',');
        if (compConfig) parallel.config = compConfig;
        const group = Group(targets, operations, parallel, compConfig);
        flag(group, 'parallel');
        return group;
    }
    if (Array.isArray(arg)) {
        if (hasFlag(arg, 'parallel')) return arg;
        return arg.reduce((a, n) => [
                ...a,
                Group(targets, operations, n, null, merge(compConfig, arg.config || {}))
            ], []);
    }
    if (typeof arg === 'string') {
        const conformed = conform(arg);
        if (isOperation(conformed)) {
            const op = Operation(targets, operations, conformed, compConfig);
            return [ op ];
        }
        return Group(targets, operations, targets[conformed], conformed, compConfig);
    }
    if (typeof arg === 'function') {
        return [ Fn(arg, name, compConfig) ];
    }
    throw new Error('invalid target in command');
};

function Queue({ targets, operations, args }) {
    return args
        .reduce((acc, arg, i, col) => isTarget(col[i - 1], arg)
              ? [ ...acc, Group(targets, operations, arg) ]
              : acc,
        []);
}
