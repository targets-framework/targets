'use strict';

const { tag } = require('./tags');
const { isObject } = require('./util');
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

const Target = (fn, name, parentConfig = {}, parentPredicates = []) => {
    const ns = name.split('.').shift();
    const fnConfig = fn.config || {};
    const config = merge(parentConfig[ns] || {}, fnConfig);
    const fnPredicates = fn.predicates || [];
    const target = { fn, name, ns, config, parentPredicates: Predicates(parentPredicates), fnPredicates: Predicates(fnPredicates) };

    if (fn.prompts) {
        target.prompts = NsPrompts(fn.prompts, ns);
        delete fn.prompts;
    }
    if (fn.config) delete fn.config;
    if (fn.predicates) delete fn.predicates;

    tag(target, 'target');

    return target;
};

const isTargetName = Target.isTargetName = exports.isTargetName = (prev, v) => !/^--?/.test(prev || '') && !/^--?/.test(v);

Target.hasTargetNames = (argv) => !!argv
    .reduce((acc, arg, i, col) => isTargetName(col[i - 1], arg)
            ? [ ...acc, arg ]
            : acc,
        []).length;

module.exports = Target;
