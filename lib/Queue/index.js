'use strict';

module.exports = Queue;

const Operation = require('../Operations/Operation');

const {
    OP_PREFIX,
    PARALLEL_FLAG
} = require('../constants');

const {
    get,
    isObject
} = require('lodash');

const {
    isOperation,
    isTarget,
    isBindShorthand,
    isReBindShorthand
} = require('../predicates');

const {
    ansiLabel
} = require('../util');

const conform = (arg) => {
    if (isBindShorthand(arg)) return `${OP_PREFIX}bind/${arg}`;
    if (isReBindShorthand(arg)) return `${OP_PREFIX}rebind/${arg.replace(OP_PREFIX,'')}`;
    return arg;
};


const NamespacedPrompts = (prompts, namespace) =>
    prompts.reduce((a, p) => {
        if (typeof p === 'string') {
            return [
                ...a,
                {
                    type: 'input',
                    name: `${namespace}.${p}`,
                    message: `${ansiLabel(`${namespace}.${p}`)} ${p}`
                }
            ];
        }
        if (isObject(p)) {
            const message = get(p, 'message', p.name);
            return [
                ...a,
                {
                    ...p,
                    name: `${namespace}.${p.name}`,
                    message: `${ansiLabel(`${namespace}.${p.name}`)} ${(typeof message === 'function')
                            ? (config) => message(config[namespace])
                            : message}`
                }
            ];
        }
        return a;
    }, []);

const Fn = (fn, name) => {
    const namespace = name.split('.').shift();
    const result = { fn, name, namespace };
    if (fn.prompts) {
        result.prompts = NamespacedPrompts(fn.prompts, namespace);
        delete fn.prompts;
    }
    return result;
};

const Group = (targets, operations, arg, name) => {
    if (typeof arg === 'string' && arg.includes(',')) {
        const group = Group(targets, operations, arg.split(','));
        group[PARALLEL_FLAG] = true;
        return group;
    }
    if (Array.isArray(arg)) {
        return arg.reduce((a, n) => {
            const group = Group(targets, operations, n);
            return [ ...a, group ];
          }, []);
    }
    if (typeof arg === 'string') {
        const conformed = conform(arg);
        if (isOperation(conformed)) return [ Operation(operations, conformed) ];
        return Group(targets, operations, targets[conformed], conformed);
    }
    if (typeof arg === 'function') {
        return [ Fn(arg, name) ];
    }
    console.log('invalid target in command');
    return [];
};

function Queue({ targets, operations, args }) {
    return args
        .reduce((acc, arg, i, col) => isTarget(col[i - 1], arg)
              ? [ ...acc, Group(targets, operations, arg) ]
              : acc,
        []);
}
