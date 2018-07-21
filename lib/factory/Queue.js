'use strict';

module.exports = Queue;

const Operation = require('./Operation');

const {
    get,
    isObject
} = require('lodash');

const {
    isOperation,
    isTarget
} = require('../predicates');

const {
    ansiLabel
} = require('./Print');

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
                    message: `${ansiLabel(`${namespace}.${p.name}`)} ${((typeof message === 'function')
                            ? (config) => message(config[namespace])
                            : message)}`
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
        return [ Group(targets, operations, arg.split(',')) ];
    }
    if (Array.isArray(arg)) {
        return arg.reduce((a, n) => {
            return [ ...a, ...Group(targets, operations, n) ];
          }, []);
    }
    if (typeof arg === 'string') {
        if (isOperation(arg)) return [ Operation(operations, arg) ];
        return Group(targets, operations, targets[arg], arg);
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
              ? [ ...acc, ...Group(targets, operations, arg) ]
              : acc,
        []);
}
