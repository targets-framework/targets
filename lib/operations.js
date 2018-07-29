'use strict';

const get = require('lodash/get');

const { on, off } = require('./store/Toggles');

const {
    BINDING_FLAG,
    DEBUG_TOGGLE:DEBUG,
    SILENT_TOGGLE:SILENT
} = require('./constants');

const bind = (fromPath, toPath, { config: { set }, results: { getLatest } }) => set(toPath, get(getLatest(), fromPath));
bind.flag = BINDING_FLAG;

const rebind = (fromPath, toPath, { config: { set, getLatest } }) => set( toPath, get(getLatest(), fromPath));
rebind.flag = BINDING_FLAG;

const binding = {
    bind,
    rebind
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
    'prompts-on': () => {},
    'prompts-off': () => {},
};

const operations = {
    ...binding,
    ...toggles,
    ...special
};

module.exports = operations;
