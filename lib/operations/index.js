'use strict';

const get = require('lodash/get');
const { merge } = require('sugarmerge');

const {
    on,
    off,
    SILENT_TOGGLE:SILENT
} = require('../store/Toggle');

const { DEBUG } = require('../debug');
const { mark } = require('../marks');
const { copyKeys } = require('../util');

const Target = require('../Target');

const bind = (fromPath, ...rest) => {
    const { config: { baseMerge, set }, result: { getLatest } } = rest.pop();
    return rest.length
        ? set(rest.pop(), get(getLatest(), fromPath))
        : baseMerge(get(getLatest(), fromPath));
};
mark(bind, 'binding');

const rebind = (fromPath, ...rest) => {
    const { config: { baseMerge, getLatest, set } } = rest.pop();
    return rest.length
        ? set(rest.pop(), get(getLatest(), fromPath))
        : baseMerge(get(getLatest(), fromPath));
};
mark(rebind, 'binding');

const rebindTo = (fromPath, targetName, { targets, config: { getLatest }, parentConfig }) => {
    const fn = targets[targetName];
    if (typeof fn === 'function') {
        const boundFn = (config, ...args) => {
            const binding = get(getLatest(), fromPath);
            return fn(merge(config, parentConfig, fn.config || {}, binding), ...args);
        };
        return Target(copyKeys(fn, boundFn), targetName);
    } else {
        throw new Error('invalid fn name in rebind-to');
    }
};
mark(rebindTo, 'target');

const Exit = (name, toggle) => (fromPath, ...rest) => {
    const { result: { getLatest } } = rest.pop();
    const compare = rest.shift() || toggle;
    const value = get(getLatest(), fromPath, toggle);
    const test = typeof compare === 'boolean'
        ? value && ![ '0', 'false' ].includes(value)
        : compare == value;
    if (toggle ? !test : test) {
        console.log(`Exiting. Reason: @${name}::${fromPath} - ${value}`);
        process.exit();
    }
};

const exitWhen = Exit('exit-when', false);
mark(exitWhen, 'binding');

const proceedWhen = Exit('proceed-when', true);
mark(proceedWhen, 'binding');

const When = (name, toggle) => (pathA, ...rest) => {
    const { targets, config: { getLatest }, parentConfig } = rest.pop();
    const targetName = rest.pop();
    const fn = targets[targetName];
    if (typeof fn === 'function') {
        const boundFn = (config, ...args) => {
            const latest = getLatest();
            const compare = rest.length
                ? get(latest, rest.pop())
                : toggle;
            const value = get(latest, pathA);
            const test = typeof compare === 'boolean'
                ? value && ![ '0', 'false' ].includes(value)
                : compare == value;
            return test
                ? fn(merge(config, parentConfig, fn.config || {}), ...args)
                : Promise.resolve(`skipping ${targetName}`);
        };
        return Target(copyKeys(fn, boundFn), targetName);
    } else {
        throw new Error('invalid fn name in when');
    }
};

const when = When('when', true);
mark(when, 'target');

const notWhen = When('not-when', false);
mark(notWhen, 'target');

mark(when, 'target');

const binding = {
    bind,
    rebind,
    when,
    notWhen,
    'rebind-to': rebindTo,
    'exit-when': exitWhen,
    'proceed-when': proceedWhen
};

const ToggleOp = (name) => (v) => {
    const fns = {
        'on': () => on(name),
        'off': () => off(name)
    };
    if (fns[v]) fns[v]();
    return;
};

const toggles = {
    'silent': ToggleOp(SILENT),
    'debug': ToggleOp(DEBUG)
};

const special = {
    'prompts': () => {},
    'optional-prompts': () => {},
};

const operations = {
    ...binding,
    ...toggles,
    ...special
};

module.exports = operations;
