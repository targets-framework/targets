'use strict';

module.exports = Queue;

const Answers = require('answers');

const {
    get,
    isObject
} = require('lodash');

const {
    BINDING_NS,
    BINDING_DELIM,
    OP_NS,
    OP_PREFIX,
    OP_DELIM
} = require('../constants');

const {
    isOperation,
    isResultBinding,
    isConfigBinding,
    isTarget
} = require('../predicates');

const {
    ansiLabel
} = require('./Print');

const ConfigStore = require('../store/ConfigStore');
const { getLatestConfig } = ConfigStore;

const {
    getLatestResult
} = require('../store/ResultStore');

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

const QueueFn = (fn, name) => {
    const namespace = name.split('.').shift();
    const result = { fn, name, namespace };
    if (fn.prompts) {
        result.prompts = NamespacedPrompts(fn.prompts, namespace);
        delete fn.prompts;
    }
    return result;
};

const QueueBinding = (binding, useResult) => {
    const [ fromPath, toPath ] = binding.split(BINDING_DELIM);
    return {
        fn: () => {
            const nextConfig = getLatestConfig();
            if (useResult) {
                const lastResult = getLatestResult();
                ConfigStore.push(Answers.deepSet(nextConfig, toPath, get(lastResult, fromPath)));
            } else {
                ConfigStore.push(Answers.deepSet(nextConfig, toPath, get(nextConfig, fromPath)));
            }
        },
        name: binding,
        namespace: BINDING_NS
    };
};

const operations = {
    'prompts-on': () => {},
    'prompts-off': () => {}
};

const QueueOperation = (op) => {
    const [ opName, arg ] = op.split(OP_DELIM);
    const opFn = operations[opName] || (() => 'unknown operation');
    return {
        fn: () => opFn(arg),
        name: `${OP_PREFIX}${opName}`,
        namespace: OP_NS
    };
};

const QueueGroup = (targets, arg, name) => {
    if (typeof arg === 'string' && arg.includes(',')) {
        return [ QueueGroup(targets, arg.split(',')) ];
    }
    if (Array.isArray(arg)) {
        return arg.reduce((a, n) => {
            return [ ...a, ...QueueGroup(targets, n) ];
          }, []);
    }
    if (typeof arg === 'string') {
        if (isResultBinding(arg)) return [ QueueBinding(arg, true) ];
        if (isConfigBinding(arg)) return [ QueueBinding(arg.replace(OP_PREFIX, '')) ];
        if (isOperation(arg)) return [ QueueOperation(arg.replace(OP_PREFIX, '')) ];
        return QueueGroup(targets, targets[arg], arg);
    }
    if (typeof arg === 'function') {
        return [ QueueFn(arg, name) ];
    }
    console.log('invalid target in command:', arg);
    return [];
};

function Queue(targets, args) {
    return args
        .reduce((acc, arg, i, col) => isTarget(col[i - 1], arg)
              ? [ ...acc, ...QueueGroup(targets, arg) ]
              : acc,
        []);
}
