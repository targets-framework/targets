'use strict';

const get = require('lodash/get');

const { on, off } = require('./store/Toggles');

const {
    BINDING_FLAG,
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
bind.flag = BINDING_FLAG;

const rebind = (fromPath, ...rest) => {
    if (rest.length === 2) {
        const [ toPath, { config: { set, getLatest } } ] = rest;
        return set(toPath, get(getLatest(), fromPath));
    } else {
        const [ { config: { getLatest, baseMerge } } ] = rest;
        return baseMerge(get(getLatest(), fromPath));
    }
};
rebind.flag = BINDING_FLAG;

const When = (ns) => (fromPath, targetName, { config: { set }, result: { getLatest } }) => {
    const targetValue = get(getLatest(), fromPath);
    const test = targetValue && targetValue != 'false' && targetValue != 0;
    return set(`${ns}.${targetName}`, test);
};
const when = When('__when__');
when.flag = BINDING_FLAG;

const whenNext = When('__when_next__');
whenNext.flag = BINDING_FLAG;

const binding = {
    bind,
    rebind,
    when,
    'when-next': whenNext
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
    'optional-prompts-on': () => {},
    'optional-prompts-off': () => {},
};

const operations = {
    ...binding,
    ...toggles,
    ...special
};

module.exports = operations;
