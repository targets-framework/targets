'use strict';

module.exports = Queue;

const answers = require('answers');
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


const NsPrompts = (prompts, ns) =>
    prompts.reduce((a, p) => {
        if (typeof p === 'string') {
            return [
                ...a,
                {
                    type: 'input',
                    name: `${ns}.${p}`,
                    message: `${ansiLabel(`${ns}.${p}`)} ${p}`
                }
            ];
        }
        if (isObject(p)) {
            const message = get(p, 'message', p.name);
            return [
                ...a,
                {
                    ...p,
                    name: `${ns}.${p.name}`,
                    message: `${ansiLabel(`${ns}.${p.name}`)} ${(typeof message === 'function')
                            ? (config) => message(config[ns])
                            : message}`
                }
            ];
        }
        return a;
    }, []);

const Fn = (fn, name, config) => {
    const ns = name.split('.').shift();
    const target = { fn, name, ns, config };
    if (fn.prompts) {
        target.prompts = NsPrompts(fn.prompts, ns);
        delete fn.prompts;
    }
    if (fn.config) delete fn.config;
    return target;
};

const BoundConfig = (name, fnConfig = {}, compConfig) => {
    const ns = name.split('.').shift();
    const nsCompConfig = compConfig[ns] || {};
    return answers.composer(nsCompConfig, fnConfig);
};

const Group = (targets, operations, arg, name, compConfig = {}) => {
    if (typeof arg === 'string' && arg.includes(',')) {
        const group = Group(targets, operations, arg.split(','));
        group[PARALLEL_FLAG] = true;
        return group;
    }
    if (Array.isArray(arg)) {
        if (arg[PARALLEL_FLAG]) return arg; // here be dragons...
        return arg.reduce((a, n) => {
            const group = Group(targets, operations, n, null, arg.config);
            return [ ...a, group ];
          }, []);
    }
    if (typeof arg === 'string') {
        const conformed = conform(arg);
        if (isOperation(conformed)) return [ Operation(operations, conformed) ];
        return Group(targets, operations, targets[conformed], conformed, compConfig);
    }
    if (typeof arg === 'function') {
        const boundConfig = BoundConfig(name, arg.config, compConfig);
        return [ Fn(arg, name, boundConfig) ];
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
