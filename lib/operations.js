'use strict';

const get = require('lodash/get');
const { merge } = require('sugarmerge');

const { on, off } = require('./store/Toggles');

const { flag } = require('./flags');

const Fn = require('./Fn');

const {
    DEBUG_TOGGLE:DEBUG,
    SILENT_TOGGLE:SILENT
} = require('./constants');

const bind = (fromPath, ...rest) => {
    if (rest.length === 2) {
        const [ toPath, { config: { set }, result: { getLatest } } ] = rest;
        return set(toPath, get(getLatest(), fromPath));
    } else {
        const [ { config: { baseMerge }, result: { getLatest } } ] = rest;
        return baseMerge(get(getLatest(), fromPath));
    }
};
flag(bind, 'binding');

const rebind = (fromPath, ...rest) => {
    if (rest.length === 2) {
        const [ toPath, { config: { set, getLatest } } ] = rest;
        return set(toPath, get(getLatest(), fromPath));
    } else {
        const [ { config: { getLatest, baseMerge } } ] = rest;
        return baseMerge(get(getLatest(), fromPath));
    }
};
flag(rebind, 'binding');

const rebindTo = (fromPath, ...rest) => {
    const [ targetName, { targets, config: { getLatest }, compConfig } ] = rest;
    const target = targets[targetName];
    if (typeof target === 'function') {
        const fn = (config, ...args) => {
            const rebound = get(getLatest(), fromPath);
            return target(merge(config, compConfig, target.config || {}, rebound), ...args);
        };
        fn.label = target.label || target.name;
        fn.config = target.config;
        return Fn(fn, targetName);
    } else {
        throw new Error('invalid target name in bind-to');
    }
};
flag(rebindTo, 'fn');

const When = (ns) => (fromPath, targetName, { config: { set }, result: { getLatest } }) => {
    const targetValue = get(getLatest(), fromPath);
    const test = targetValue && targetValue != 'false' && targetValue != 0;
    return set(`${ns}.${targetName}`, test);
};

const when = When('__when__');
flag(when, 'binding');

const whenNext = When('__when_next__');
flag(whenNext, 'binding');

const Exit = (name, toggle) => (fromPath, ...rest) => {
    const compare = (rest.length === 2)
        ? rest.shift()
        : toggle;
    const [ { result: { getLatest } } ] = rest;
    const value = get(getLatest(), fromPath, toggle);
    const test = typeof compare === 'boolean'
        ? value
        : compare == value;
    if (toggle ? !test : test) {
        console.log(`Exiting. Reason: @${name}::${fromPath} - ${value}`);
        process.exit();
    }
};

const exitWhen = Exit('exit-when', false);
flag(exitWhen, 'binding');

const proceedWhen = Exit('proceed-when', true);
flag(proceedWhen, 'binding');

const binding = {
    bind,
    rebind,
    'rebind-to': rebindTo,
    when,
    'when-next': whenNext,
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
