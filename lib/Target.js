'use strict';

module.exports = Target;

const { tag } = require('./tags');
const { isObject, notNil } = require('./util');
const { ansiLabel } = require('./print');
const { merge } = require('sugarmerge');
const Predicates = require('./Predicates');

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

function Target({ fn, name, config:parentConfig = {}, predicates = [], silent = false }) {
    const label = fn.label || name;
    const ns = name.split('.').shift();
    const fnConfig = fn.config || {};
    const config = merge(parentConfig[ns] || {}, fnConfig);
    const parentPredicates = Predicates(predicates);
    const fnPredicates = Predicates(fn.predicates || []);

    const target = {
        fn,
        name,
        label,
        ns,
        config,
        parentPredicates,
        fnPredicates,
        silent: fn.silent || silent
    };

    tag(target, 'target');

    if (Array.isArray(fn.prompts)) {
        target.prompts = NsPrompts(fn.prompts, ns);
        delete fn.prompts;
    }

    // cleanup is not strictly necessary... but it helps make sure we
    // always key off the envelope and don't accidentally couple to
    // implementation
    if (notNil(fn.config)) delete fn.config;
    if (notNil(fn.predicates)) delete fn.predicates;
    if (notNil(fn.silent)) delete fn.silent;

    return target;
}

const isTargetName = Target.isTargetName = exports.isTargetName = (prev, v) => !/^--?/.test(prev || '') && !/^--?/.test(v);

Target.hasTargetNames = (argv) => !!argv
    .reduce((acc, arg, i, col) => isTargetName(col[i - 1], arg)
            ? [ ...acc, arg ]
            : acc,
        []).length;

