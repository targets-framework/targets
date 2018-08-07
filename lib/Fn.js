'use strict';

const {
    flag
} = require('./flags');

const {
    isObject,
    ansiLabel
} = require('./util');

const { merge } = require('sugarmerge');

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
            const message = p.message || p.name;
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

const Fn = (fn, name, boundConfig = {}) => {
    const ns = name.split('.').shift();
    const config = merge(boundConfig[ns] || {}, fn.config || {});
    const target = { fn, name, ns, config };

    if (fn.prompts) {
        target.prompts = NsPrompts(fn.prompts, ns);
        delete fn.prompts;
    }
    if (fn.config) delete fn.config;

    flag(target, 'fn');

    return target;
};

module.exports = Fn;
