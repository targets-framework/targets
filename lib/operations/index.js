'use strict';

const get = require('lodash/get');
const { merge } = require('sugarmerge');
const { on, off, SILENT_TOGGLE:SILENT } = require('../store/Toggle');
const { DEBUG } = require('../debug');
const { tag } = require('../tags');
const { copyKeys, cloneFn } = require('../util');
const Target = require('../Target');

const bind = (fromPath, ...rest) => {
    const { config: { baseMerge, set }, result: { getLatest } } = rest.pop();
    return rest.length
        ? set(rest.pop(), get(getLatest(), fromPath))
        : baseMerge(get(getLatest(), fromPath));
};
tag(bind, 'binding');

const rebind = (fromPath, ...rest) => {
    const { config: { baseMerge, getLatest, set } } = rest.pop();
    return rest.length
        ? set(rest.pop(), get(getLatest(), fromPath))
        : baseMerge(get(getLatest(), fromPath));
};
tag(rebind, 'binding');

const rebindTo = (fromPath, targetName, { targets, config: { getLatest }, parentConfig }) => {
    const fn = targets[targetName];
    if (typeof fn === 'function') {
        const boundFn = (config, ...args) => {
            const binding = get(getLatest(), fromPath);
            return fn(merge(config, parentConfig, fn.config || {}, binding), ...args); // should get namespace from parent config instead of top-level merge?
        };
        return Target(copyKeys(fn, boundFn), targetName);
    } else {
        throw new Error('invalid fn name in rebind-to');
    }
};
tag(rebindTo, 'target');

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
tag(exitWhen, 'binding');

const proceedWhen = Exit('proceed-when', true);
tag(proceedWhen, 'binding');

const When = (name, type, toggle) => (testPath, ...rest) => {
    const injected = rest.pop();
    const { targets, parentConfig, parentPredicates } = injected;
    const { getLatest } = injected[type];
    const targetName = rest.pop();
    const fn = targets[targetName];
    if (typeof fn === 'function') {
        const clonedFn = cloneFn(fn);
        const predicate = () => {
            const latest = getLatest();
            const value = get(latest, testPath);
            let p;
            const compare = rest.length
                ? (p = rest.pop(), get(latest, p, p))
                : toggle;
            console.log(name, value, compare);
            return typeof compare === 'boolean'
                ? value && ![ '0', 'false' ].includes(value)
                : compare == value;
        };
        return Target(clonedFn, targetName, parentConfig, [ ...parentPredicates, predicate ]);
    } else {
        throw new Error('invalid fn name in when');
    }
};

const when = When('when', 'config', true);
tag(when, 'target');

const whenNot = When('when-not', 'config', false);
tag(whenNot, 'target');

const whenResult = When('when-result', 'result', true);
tag(whenResult, 'target');

const whenNotResult = When('when-not-result', 'result', false);
tag(whenNotResult, 'target');

const Log = (type) => (fromPath, injected) => {
    const { getLatest } = injected[type];
    return Target((...r) => r[r.length - 1](get(getLatest(), fromPath)), '@log');
};

const log = Log('config');
tag(log, 'target');

const logResult = Log('result');
tag(logResult, 'target');

const binding = {
    bind,
    rebind,
    when,
    'when-not': whenNot,
    'when-result': whenResult,
    'when-not-result': whenNotResult,
    'rebind-to': rebindTo,
    'exit-when': exitWhen,
    'proceed-when': proceedWhen,
    log,
    'log-result': logResult
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
